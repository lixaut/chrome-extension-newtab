#!/usr/bin/env node
/**
 * 生成节假日种子数据 src/data/holidays.json
 *
 * 上游: jsDelivr 上的 chinese-days（MIT，跟随国务院公告当天更新）
 * 输出: 与服务器 holiday.json 完全同构的 HolidayDataset，两者可互换
 *
 * 用法: npm run update:seed
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/chinese-days@latest/dist/chinese-days.json';
/** 种子年份跨度：当前年前后各 N 年 */
const YEARS_SPAN = 1;

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT_FILE = path.join(root, 'src', 'data', 'holidays.json');

/** 上游条目形如 "National Day,国庆节,3"，取中文名 */
const cnName = (raw) => String(raw).split(',')[1] ?? '';

/** YYYY-MM-DD -> 1..7（周一至周日） */
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

/** 内容指纹：数据变化才变，避免无谓的重渲染 */
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
  const res = await fetch(CDN_URL, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`拉取上游失败: ${res.status} ${CDN_URL}`);
  const src = await res.json();

  const year = new Date().getFullYear();
  const years = [year - YEARS_SPAN, year, year + YEARS_SPAN];
  const holidays = convert(src, years);

  if (Object.keys(holidays).length === 0) throw new Error('转换结果为空，终止');

  const dataset = {
    version: `v${fingerprint(holidays)}`,
    generated_at: new Date().toISOString(),
    source: 'chinese-days',
    years,
    holidays
  };

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
  console.log(
    `✓ ${path.relative(root, OUT_FILE)}  年份 ${years.join('/')}  ` +
      `${Object.keys(holidays).length} 条  version=${dataset.version}`
  );
};

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
