#!/usr/bin/env node
/**
 * 节假日数据生成脚本（部署到服务器上运行）
 *
 * 上游: jsDelivr 上的 chinese-days（MIT，跟随国务院公告当天更新）
 * 输出: 扩展可直接消费的 HolidayDataset JSON
 *
 * 用法:
 *   node build-holiday.mjs [输出路径]
 *   默认输出 ./holiday.json
 *
 * 行为保证:
 *   - 任一环节失败 → 非 0 退出且不改动已有文件（扩展继续用缓存）
 *   - 先写临时文件再 rename，扩展不会读到半截数据
 *   - 内容无变化则不重写，mtime 稳定
 *
 * 注意: 转换逻辑需与扩展侧 scripts/build-seed.mjs 保持一致
 */
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/chinese-days@latest/dist/chinese-days.json';
/** 与扩展内置种子相同的年份跨度：当前年前后各 N 年 */
const YEARS_SPAN = 1;

const OUT_FILE = path.resolve(process.argv[2] ?? path.join(process.cwd(), 'holiday.json'));

const cnName = (raw) => String(raw).split(',')[1] ?? '';

const weekOf = (date) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
};

const convert = (src, years) => {
  const holidays = {};
  const pick = (entries, type) => {
    for (const [date, raw] of Object.entries(entries ?? {})) {
      if (!years.includes(Number(date.slice(0, 4)))) continue;
      holidays[date] = { type, week: weekOf(date), name: cnName(raw) };
    }
  };
  pick(src.holidays, 2); // 休
  pick(src.workdays, 3); // 班
  return Object.fromEntries(Object.entries(holidays).sort(([a], [b]) => a.localeCompare(b)));
};

/** 与扩展侧一致的内容指纹：数据不变则 version 不变 */
const fingerprint = (holidays) => {
  const text = JSON.stringify(holidays);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const main = async () => {
  const response = await fetch(CDN_URL, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`拉取上游失败: ${response.status}`);
  const src = await response.json();

  const year = new Date().getFullYear();
  const years = [year - YEARS_SPAN, year, year + YEARS_SPAN];
  const holidays = convert(src, years);
  const count = Object.keys(holidays).length;
  if (count === 0) throw new Error('转换结果为空');

  const dataset = {
    version: `v${fingerprint(holidays)}`,
    generated_at: new Date().toISOString(),
    source: 'chinese-days',
    years,
    holidays
  };
  const next = `${JSON.stringify(dataset, null, 2)}\n`;

  // 内容未变化则跳过写入，保持 mtime 稳定
  try {
    const current = await readFile(OUT_FILE, 'utf8');
    const parsed = JSON.parse(current);
    if (parsed.holidays && fingerprint(parsed.holidays) === dataset.version.slice(1)) {
      console.log(`= 内容无变化，跳过写入: ${OUT_FILE}`);
      return;
    }
  } catch {
    /* 文件不存在或损坏，继续写入 */
  }

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  const tmp = `${OUT_FILE}.tmp-${process.pid}`;
  await writeFile(tmp, next, 'utf8');
  await rename(tmp, OUT_FILE).catch(async (err) => {
    await unlink(tmp).catch(() => {});
    throw err;
  });

  console.log(`✓ ${OUT_FILE}  年份 ${years.join('/')}  ${count} 条  version=${dataset.version}`);
};

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
