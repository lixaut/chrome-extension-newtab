<template>
  <div class="home-page">
    <CardBox width="100%" height="100%">
      <template #content>
        <div class="time">
          <span class="hour">{{ timeList[0] }}</span>
          <span>{{ timeList[1] }}</span>
        </div>
        <div class="date">
          <span>{{ dateList[0] }}</span>
          <span class="day">{{ dateList[1] }}</span>
        </div>
        <div class="week">
          <span>{{ week }}</span>
        </div>
      </template>
    </CardBox>
  </div>
</template>

<script setup lang="ts">
import { defineOptions, ref, onUnmounted, onMounted } from 'vue';
import CardBox from '@/components/CardBox/index.vue';
import dayjs from 'dayjs';

let timeList = ref<Array<string>>([]);
let dateList = ref<Array<string>>([]);
let week = ref<string>('');
let timer = ref<number>(0);

const initTime = () => {
  timeList.value = [dayjs().format('HH'), dayjs().format(':mm:ss')];
  timer.value = setInterval(() => {
    timeList.value = [dayjs().format('HH'), dayjs().format(':mm:ss')];
  }, 1000);
};

const initDate = () => {
  dateList.value = [dayjs().format('YYYY/MM/'), dayjs().format('DD')];
};

const initWeek = () => {
  week.value = dayjs().format('dddd');
};

onMounted(() => {
  initTime();
  initDate();
  initWeek();
});

onUnmounted(() => {
  clearInterval(timer.value);
});

defineOptions({
  name: 'HomePage'
});
</script>

<style lang="scss" scoped>
.home-page {
  width: 100vw;
  height: 100vh;
  background: $-theme-dark-color;
  padding: 10px;
  .time {
    height: 4rem;
    line-height: 4rem;
    font-size: 4rem;
    color: $-github-font-color-w;
    user-select: none;
    position: absolute;
    font-family: 'font-num';
    bottom: 22%;
    .hour {
      color: $-github-font-color-b;
    }
  }
  .date {
    position: absolute;
    height: 2.4rem;
    line-height: 2.4rem;
    font-size: 1.6rem;
    bottom: 0;
    font-family: 'font-num';
    color: $-github-font-color-g;
    .day {
      color: $-github-font-color-b;
    }
  }
  .week {
    font-family: 'font-num';
    font-size: 1.4rem;
    color: $-github-font-color-g;
  }
}
</style>
