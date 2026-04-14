<template>
  <div class="card">
    <div class="label">HOLIDAY / 节日</div>
    <div class="tag">{{ dayjs(holiday.date).locale('zh-cn').format('MM月DD日') }}</div>
    <div class="festival">
      <span class="name">{{ holiday.name }}</span>
      <span class="long">距离假期还有 {{ holiday.rest }} 天</span>
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
import axios from 'axios';
import dayjs from 'dayjs';

interface DayData {
  week: number;
  date: string;
  type: number;
}
interface MapType {
  [key: number]: string;
}
interface HolidayApi {
  code: number;
  holiday: Record<string, { type: number, week: number }>;
  type: Record<string, { week: number, type: number }>;
  tts?: string;
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

const holidayTip = ref('');
const days = ref<Array<DayData>>([]);
const holiday = ref<{ date: string; name: string; rest: number }>({
  date: '',
  name: '',
  rest: 0
});
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
 * 获取下一个节假日信息
 */
const getNextHoliday = async () => {
  // 获取下一个节假日
  const options = { method: 'GET', url: 'http://timor.tech/api/holiday/next?type=Y&week=N' };
  try {
    const { data: res } = await axios.request(options);
    if (res.code === 0) {
      holiday.value.date = res.holiday.date;
      holiday.value.name = res.holiday.name;
      holiday.value.rest = res.holiday.rest;
      getHolidayDays(res.holiday.date);
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * 获取节假日信息
 * @param date 日期
 */
const getHolidayDays = async (date: string) => {
  const options = {
    method: 'GET',
    url: `http://timor.tech/api/holiday/year/${dayjs(date).format('YYYY-MM')}?type=Y&week=N`
  };
  try {
    const { data: res } = await axios.request<HolidayApi>(options);
    if (res.code === 0) {
      for (let [key, value] of Object.entries(res.type)) {
        console.log(key, value);
        days.value.push({
          week: value.week as number,
          date: key,
          type: dayjs().format('YYYY-MM-DD') == key ? 10 : value.type as number
        })
      }
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * 获取节假日提示
 */
const getHolidayTip = async () => {
  const options = {
    method: 'GET',
    url: `http://timor.tech/api/holiday/tts`
  };
  try {
    const { data: res } = await axios.request<HolidayApi>(options);
    if (res.code === 0) {
      holidayTip.value = res.tts || '';
    }
  } catch (error) {
    console.error(error);
  }
}

onBeforeMount(() => {
  getNextHoliday();
  getHolidayTip();
});
</script>

<style lang="scss" scoped>
.card {
  width: 6rem;
  min-height: 3.2rem;
  background-color: var(--color-card-bg);
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
      color: var(--color-fg);
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
