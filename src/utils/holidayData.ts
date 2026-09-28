import seed from '@/data/holidays.json';

/** 单个法定日：2 = 休（放假），3 = 班（调休补班） */
export interface HolidayDay {
  type: 2 | 3;
  /** 一周中的第几天，1-7 对应周一至周日 */
  week: number;
  /** 节假日名称 */
  name: string;
}

/** 种子与远程数据同构，两者可互换 */
export interface HolidayDataset {
  /** 内容指纹，数据变化才会变，用于避免无谓重渲染 */
  version: string;
  /** 数据生成时间，ISO 8601，用于新旧取舍 */
  generated_at: string;
  source?: string;
  years?: number[];
  holidays: Record<string, HolidayDay>;
}

const CACHE_KEY = 'newtaber:holiday:v1';
/** 缓存永不过期，此值仅决定多久尝试刷新一次 */
const CACHE_TTL = 24 * 60 * 60 * 1000;
const DEFAULT_TIMEOUT = 8000;

/** 服务器地址，来自 .env，不写死在代码里；留空则完全使用内置种子 */
const REMOTE_URL: string = String(import.meta.env.VITE_HOLIDAY_API ?? '').trim();
const FETCH_TIMEOUT: number = Number(import.meta.env.VITE_HOLIDAY_TIMEOUT) || DEFAULT_TIMEOUT;

const seedData = seed as HolidayDataset;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** 结构校验：非法数据一律拒绝，宁可回退也不污染缓存 */
const isValid = (value: unknown): value is HolidayDataset => {
  if (!isRecord(value)) return false;
  if (typeof value.version !== 'string' || typeof value.generated_at !== 'string') return false;
  if (!isRecord(value.holidays) || Object.keys(value.holidays).length === 0) return false;
  return Object.values(value.holidays).every(
    (item) =>
      isRecord(item) &&
      (item.type === 2 || item.type === 3) &&
      typeof item.week === 'number' &&
      typeof item.name === 'string'
  );
};

/** 读取本地缓存，非法或缺失时返回 null */
export function readCache(): HolidayDataset | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** 写入本地缓存，失败静默（隐私模式 / 配额不足） */
export function writeCache(data: HolidayDataset): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* 忽略 */
  }
}

/** a 是否比 b 新 */
export function isNewer(a: HolidayDataset, b: HolidayDataset): boolean {
  return Date.parse(a.generated_at) > Date.parse(b.generated_at);
}

/** 当前可用数据：缓存与种子里较新的一份，永不为 null */
export function currentData(): HolidayDataset {
  const cached = readCache();
  if (!cached) return seedData;
  return isNewer(cached, seedData) ? cached : seedData;
}

/** 缓存是否超过刷新周期 */
export function isStale(): boolean {
  const cached = readCache();
  if (!cached) return true;
  const at = Date.parse(cached.generated_at);
  if (Number.isNaN(at)) return true;
  return Date.now() - at > CACHE_TTL;
}

/** 拉取服务器数据，任何失败（未配置 / 超时 / 网络 / 结构非法）都返回 null */
export async function fetchRemote(): Promise<HolidayDataset | null> {
  if (!REMOTE_URL) return null;
  try {
    const response = await fetch(REMOTE_URL, {
      cache: 'no-cache',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT)
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return isValid(data) ? data : null;
  } catch {
    return null;
  }
}
