import dayjs from 'dayjs';

/**
 * 基于日期生成缓存管理器，自动按天隔离和清理缓存
 * @param keys - 需要初始化的缓存键名列表
 * @returns 包含 getCache 和 setCache 方法的对象
 */
const useCacheByDate = <T extends string>(keys: T[]) => {
  const today = dayjs().format('YYYY_MM_DD');
  const todayCache = localStorage.getItem(today);
  const lastCacheKey = localStorage.getItem('LAST_CACHE_KEY');

  if (!lastCacheKey) {
    localStorage.setItem('LAST_CACHE_KEY', today);
  } else if (lastCacheKey !== today) {
    localStorage.removeItem(lastCacheKey);
    localStorage.setItem('LAST_CACHE_KEY', today);
  }

  if (!todayCache) {
    const cache: Record<T, any> = {} as Record<T, any>;
    keys.forEach((key) => {
      cache[key] = null;
    });
    localStorage.setItem(today, JSON.stringify(cache));
  }

  const getCache = (key: T) => {
    const cache = JSON.parse(localStorage.getItem(today) || '{}');
    return cache[key];
  };

  const setCache = (key: T, value: any) => {
    const cache = JSON.parse(localStorage.getItem(today) || '{}');
    cache[key] = value;
    localStorage.setItem(today, JSON.stringify(cache));
  };

  return {
    getCache,
    setCache
  };
};

export default useCacheByDate;
