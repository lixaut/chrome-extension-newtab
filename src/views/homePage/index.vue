<template>
  <div class="container">
    <div class="mask"></div>
    <div class="content">
      <div class="time-label">TERMINAL TIME / 当前时间</div>
      <div class="time">
        <span class="hour">{{ times[0] }}</span>
        <span class="minute">{{ times[1] }}</span>
      </div>
      <div class="date">{{ times[2] }}</div>
      <div class="lunar">{{ '农历' + times[3] }}</div>
      <div class="week">{{ times[4] }}</div>
      <HolidayCard style="margin-top: 0.6rem;" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import HolidayCard from './HolidayCard.vue';
import { PluginLunar } from "dayjs-plugin-lunar";

dayjs.extend(PluginLunar);

const times = ref<Array<string>>([]);
const timer = ref<number>(0);

const initTimes = () => {
  timer.value = setInterval(() => {
    setTime()
  }, 1000);
};

const setTime = () => {
  times.value = [
    dayjs().format('HH'),
    dayjs().format('mm'),
    dayjs().format('M月DD日'),
    dayjs().format('LMLD'),
    dayjs().locale('en').format('dddd').toUpperCase() + ' / ' + dayjs().locale('zh-cn').format('dddd')
  ];
};

onBeforeMount(() => {
  setTime()
  initTimes();
});

onUnmounted(() => {
  clearInterval(timer.value);
});

defineOptions({
  name: 'HomePage'
});
</script>

<style lang="scss" scoped>
.container {
  width: 100vw;
  height: 100vh;
  background-color: var(--color-bg);
  position: relative;

  .content {
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;

    .time-label {
      font-family: 'Inter';
      font-size: 0.12rem;
      font-weight: 500;
      letter-spacing: 0.04rem;
      color: var(--color-text-body);
      margin-bottom: 0.2rem;
    }

    .time {
      font-family: 'Manrope';
      font-size: 1.8rem;
      font-weight: 800;

      .hour {
        color: var(--color-primary);
      }

      .minute {
        color: var(--color-fg);
      }
    }

    .date {
      font-family: 'Manrope';
      font-size: 0.28rem;
      font-weight: 500;
      color: var(--color-text-headline);
      margin-top: 0.2rem;
    }

    .lunar {
      font-family: 'Inter';
      font-size: 0.14rem;
      font-weight: 500;
      color: var(--color-text-body);
      letter-spacing: 0.01rem;
      margin-top: 0.1rem;
    }

    .week {
      font-family: 'Inter';
      font-size: 0.14rem;
      font-weight: 500;
      color: var(--color-primary);
      letter-spacing: 0.02rem;
      margin-top: 0.1rem;
    }
  }

  .mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 0% 0%,
        var(--color-primary-t3) 0%,
        var(--color-primary-t0) 30%,
        var(--color-primary-t0) 100%);
  }
}
</style>
