<template>
  <div class="card" v-fade-loading="loading">
    <div class="label">HOLIDAY / 节日</div>
    <div class="tag">
      {{ (holiday.date ? dayjs(holiday.date) : dayjs()).locale('zh-cn').format('MM月DD日') }}
    </div>
    <div class="festival">
      <span class="name">{{ holiday.name || '暂无节假日' }}</span>
      <span class="long" v-if="holiday.rest > 0">距离假期还有 {{ holiday.rest }} 天</span>
    </div>
    <div class="info">{{ holidayTip }}</div>
    <div class="holidays">
      <div class="day" :class="[dayClassName(item)]" v-for="item in days" :key="item.date">
        <span class="week">{{ weekMap[item.week] }}</span>
        <div class="date">
          {{ dayjs(item.date).format('D') }}
          <span class="type">{{ typeMap[item.type] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import dayjs from 'dayjs';
import type { HolidayDataset } from '@/utils/holidayData';
import { currentData, fetchRemote, isStale, isNewer, readCache, writeCache } from '@/utils/holidayData';

interface DayData {
  week: number;
  date: string;
  type: number;
}
interface MapType {
  [key: number]: string;
}

const typeMap: MapType = {
  2: '休',
  3: '班',
  10: '今'
}
const weekMap: MapType = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '日'
}

const loading = ref(true);
const holidayTip = ref('');
const days = ref<Array<DayData>>([]);
const holiday = ref<{ date: string; name: string; rest: number }>({
  date: '',
  name: '',
  rest: 0
});
/** 当前生效的节假日数据（服务器缓存或内置种子，二者结构同构） */
const source = ref<HolidayDataset>(currentData());
const dayClassName = (item: DayData) => {
  if (item.date == dayjs().format('YYYY-MM-DD')) {
    return 'active';
  } else {
    if (item.type == 2) {
      return 'rest'
    }
    if (item.type == 3) {
      return 'work'
    }
  }
}

/**
 * 查询下一个法定休假日（严格晚于今天）
 */
const findNextHoliday = () => {
  const table = source.value.holidays;
  const today = dayjs().format('YYYY-MM-DD');
  const date = Object.keys(table)
    .sort()
    .find((key) => table[key].type === 2 && key > today);

  if (!date) return null;
  return { date, name: table[date].name, rest: dayjs(date).diff(today, 'day') };
};

/**
 * 获取节假日信息（该月所有法定日）
 * @param date 日期
 */
const getHolidayDays = (date: string) => {
  const month = dayjs(date).format('YYYY-MM');
  const monthStart = dayjs(`${month}-01`);
  const today = dayjs().format('YYYY-MM-DD');
  const table = source.value.holidays;
  const list: DayData[] = [];

  for (let i = 0; i < monthStart.daysInMonth(); i++) {
    const current = monthStart.add(i, 'day');
    const key = current.format('YYYY-MM-DD');
    const item = table[key];
    if (!item) continue;

    list.push({
      week: item.week,
      date: key,
      type: today === key ? 10 : item.type
    });
  }

  days.value = list;
};

/** 依据 source 重新计算全部展示数据，幂等可重入 */
const applyRender = () => {
  const next = findNextHoliday();

  if (!next) {
    holiday.value = { date: '', name: '', rest: 0 };
    holidayTip.value = '';
    days.value = [];
    return;
  }

  holiday.value = next;
  holidayTip.value = `还有${next.rest}天就是${next.name}了。`;
  getHolidayDays(next.date);
};

/** 后台刷新：失败保持原有数据不变，仅在数据更新时重渲染 */
const refreshRemote = async () => {
  const next = await fetchRemote();
  if (!next || !isNewer(next, source.value)) return;

  writeCache(next);
  const changed = next.version !== source.value.version;
  source.value = next;
  if (changed) applyRender();
};

onBeforeMount(() => {
  applyRender();

  setTimeout(() => {
    loading.value = false;
  }, 0);

  if (!readCache() || isStale()) void refreshRemote();
});
</script>

<style lang="scss" scoped>
.card {
  width: 6rem;
  min-height: 3.2rem;
  background-color: var(--color-base-secondary);
  border-radius: var(--card-border-radius);
  padding: 0.3rem;
  position: relative;

  .label {
    font-family: 'Manrope';
    font-size: 0.16rem;
    font-weight: 500;
    color: var(--color-text-headline);
    letter-spacing: 0.02rem;
  }

  .tag {
    font-family: 'Manrope';
    font-size: 0.16rem;
    font-weight: 600;
    color: var(--color-primary-t6);
    letter-spacing: 0.01rem;
    height: 0.3rem;
    background: var(--color-primary-t2);
    border-radius: 0.15rem;
    display: inline-block;
    line-height: 0.3rem;
    padding: 0 0.14rem;
    position: absolute;
    top: 0.3rem;
    right: 0.3rem;
  }

  .festival {
    height: 0.5rem;
    line-height: 0.5rem;
    display: flex;
    align-items: flex-end;
    margin-top: 0.3rem;

    .name {
      font-family: 'Manrope';
      font-size: 0.5rem;
      height: 0.5rem;
      line-height: 0.5rem;
      font-weight: 800;
      color: var(--color-inverted);
    }

    .long {
      font-family: 'Manrope';
      font-size: 0.16rem;
      height: 0.16rem;
      line-height: 0.16rem;
      font-weight: 500;
      color: var(--color-primary);
      margin-left: 0.1rem;
    }
  }

  .info {
    margin-top: 0.14rem;
    font-family: 'Manrope';
    font-size: 0.16rem;
    line-height: 0.2rem;
    font-weight: 500;
    color: var(--color-text-body);
  }

  .holidays {
    margin-top: 0.2rem;
    display: flex;
    justify-content: flex-start;

    .day {
      &+.day {
        margin-left: 0.08rem;
      }

      &.active {
        .date {
          background: var(--color-primary);
          color: var(--color-bg);
        }

        .type {
          color: var(--color-bg);
        }
      }

      &.rest {
        .date {
          background: var(--color-primary-t4);
          color: var(--color-primary);
        }

        .type {
          color: var(--color-primary);
        }
      }

      &.work {
        .date {
          background: var(--color-primary-t2);
          color: var(--color-primary-t5);
        }

        .type {
          color: var(--color-primary-t5);
        }
      }

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .week {
        font-family: 'Inter';
        font-size: 0.14rem;
        font-weight: 500;
        color: var(--color-text-body);
        margin-bottom: 0.1rem;
      }

      .date {
        font-family: 'Manrope';
        font-size: 0.17rem;
        font-weight: 500;
        width: 0.47rem;
        height: 0.6rem;
        border-radius: 0.04rem;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        color: var(--color-text-body);
      }

      .type {
        position: absolute;
        top: 0.05rem;
        right: 0.05rem;
        font-family: 'Inter';
        font-size: 0.1rem;
        font-weight: 500;
        color: var(--color-text-body);
      }
    }
  }
}
</style>
