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
 *
 * Webhook 通知:
 *   数据更新或运行失败时向飞书群机器人推送一条摘要；内容无变化只记日志不通知
 *   （需配置 env，见 .env.example）
 */
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/chinese-days@latest/dist/chinese-days.json';
/** 与扩展内置种子相同的年份跨度：当前年前后各 N 年 */
const YEARS_SPAN = 1;

const OUT_FILE = path.resolve(process.argv[2] ?? path.join(process.cwd(), 'holiday.json'));

/** 飞书机器人 webhook（可选，未配置则不通知） */
const FEISHU_WEBHOOK = process.env.FEISHU_WEBHOOK?.trim() || '';

/** 通知时间显示时区（IANA 名称，如 Asia/Shanghai）；默认跟随服务器 TZ */
const TZ_NOTIFY = process.env.TZ_NOTIFY?.trim() || undefined;

const START_AT = Date.now();

/** 按 TZ_NOTIFY 格式化时间；时区名非法时降级为 UTC */
const formatTime = (options, date = new Date()) => {
  try {
    return new Intl.DateTimeFormat('zh-CN', { timeZone: TZ_NOTIFY, ...options })
      .format(date)
      .replaceAll('/', '-');
  } catch {
    return date.toISOString();
  }
};

/** 本地时间字符串，如 2026-09-29 15:07 */
const localTime = (date = new Date()) =>
  formatTime({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }, date);

/** 日志时间戳，如 2026-09-29 15:07:33 */
const stamp = (date = new Date()) =>
  formatTime({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }, date);

const log = (...args) => console.log(`[${stamp()}]`, ...args);
const logErr = (...args) => console.error(`[${stamp()}]`, ...args);

/** 运行耗时，如 3.2s */
const elapsed = () => `${((Date.now() - START_AT) / 1000).toFixed(1)}s`;

/** 新增/移除的节假日条数最多各列几条，超出折叠 */
const MAX_DIFF_ITEMS = 5;

const diffHolidays = (oldHolidays = {}, newHolidays = {}) => {
  const added = [];
  const removed = [];
  const changed = [];
  const dates = new Set([...Object.keys(oldHolidays), ...Object.keys(newHolidays)]);
  for (const date of [...dates].sort()) {
    const a = oldHolidays[date];
    const b = newHolidays[date];
    if (!a && b) added.push(date);
    else if (a && !b) removed.push(date);
    else if (JSON.stringify(a) !== JSON.stringify(b)) changed.push(date);
  }
  return { added, removed, changed };
};

const fmtItems = (items, max = MAX_DIFF_ITEMS) =>
  items.length === 0 ? '' : items.slice(0, max).join('、') + (items.length > max ? ` 等 ${items.length} 条` : '');

/** 富文本节点快捷构造（text 内可用 <font color='green'>…</font>，飞书 post 会渲染） */
const t = (text) => ({ tag: 'text', text });
// post 不支持 <br>，换行靠分段: content 的每个子数组即一段

/** 推送飞书富文本（post）消息；失败只记日志，不影响主流程 */
const notifyFeishu = async (post) => {
  if (!FEISHU_WEBHOOK) return;
  try {
    const res = await fetch(FEISHU_WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ msg_type: 'post', content: { post: { zh_cn: post } } })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.code) throw new Error(`HTTP ${res.status} code=${body.code ?? ''} ${body.msg ?? ''}`.trim());
    log('✓ 飞书通知已发送');
  } catch (err) {
    logErr(`✗ 飞书通知发送失败: ${err.message}`);
  }
};

/**
 * 三种通知统一组装为 post 结构:
 *   { title, content: [ [节点...], ... ] }，节点见上方构造器
 * post 富文本可用 <font color='green'>…</font>（在 text 内嵌 HTML 标签，飞书会渲染）
 */
const metaLine = () => `时间: ${localTime()} · 耗时 ${elapsed()}`;

/** 数据更新成功的通知（含新旧数据 diff）。每行一个子数组 = 一段 */
const updateMessage = (dataset, diff) => {
  const { added, removed, changed } = diff;
  const rows = [
    [t(metaLine())],
    [t(`年份: ${dataset.years.join('/')} · 共 ${Object.keys(dataset.holidays).length} 条`)]
  ];
  if (added.length) rows.push([t(`<font color='green'>新增假期</font>: ${fmtItems(added)}`)]);
  if (removed.length) rows.push([t(`<font color='red'>移除</font>: ${fmtItems(removed)}`)]);
  if (changed.length) rows.push([t(`<font color='orange'>调整</font>: ${fmtItems(changed)}`)]);
  if (!added.length && !removed.length && !changed.length) rows.push([t('(条目无增删，仅版本变化)')]);
  return {
    title: `✅ 节假日数据已更新 ${dataset.version}`,
    content: rows
  };
};

/** 运行失败的通知 */
const failureMessage = (err) => ({
  title: `❌ 节假日数据更新失败`,
  content: [
    [t(metaLine())],
    [t(`<font color='red'>原因</font>: ${err?.message ?? String(err)}`)],
    [t('已有数据保持不变，将于下次运行自动重试')]
  ]
});

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

  // 内容未变化则跳过写入，保持 mtime 稳定（只记日志，不推送通知）
  let oldHolidays = null;
  try {
    const current = await readFile(OUT_FILE, 'utf8');
    const parsed = JSON.parse(current);
    if (parsed.holidays && fingerprint(parsed.holidays) === dataset.version.slice(1)) {
      log(`= 内容无变化，跳过写入: ${OUT_FILE}`);
      return;
    }
    oldHolidays = parsed.holidays;
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

  log(`✓ ${OUT_FILE}  年份 ${years.join('/')}  ${count} 条  version=${dataset.version}`);

  await notifyFeishu(updateMessage(dataset, oldHolidays ? diffHolidays(oldHolidays, holidays) : { added: [], removed: [], changed: [] }));
};

main().catch(async (err) => {
  logErr(`✗ ${err.message}`);
  await notifyFeishu(failureMessage(err));
  process.exit(1);
});
