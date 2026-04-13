<template>
  <div class="card">
    <div class="label">HOLIDAY / 节日</div>
    <div class="festival">
      <span class="name">春节</span>
      <span class="long">距离假期还有 {{ 2 }} 天</span>
    </div>
    <div class="info">农历正月初一，中华民族最重要的传统节日。</div>
  </div>
</template>

<script setup lang='ts'>
import { onMounted } from 'vue';
import axios from 'axios';

/**
 * 更新节假日信息
 */
const updateHoliday = async () => {
  // 获取下一个节假日
  const options = { method: 'GET', url: 'http://timor.tech/api/holiday/next?type=Y&week=N' };
  try {
    const { data } = await axios.request(options);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => {
  updateHoliday();
});
</script>

<style lang='scss' scoped>
.card {
  width: 6rem;
  height: 3.2rem;
  background-color: var(--color-card-bg);
  border-radius: var(--card-border-radius);
  padding: 0.3rem;

  .label {
    font-family: 'Manrope';
    font-size: 0.16rem;
    font-weight: 500;
    color: var(--color-text-headline);
    letter-spacing: 0.02rem;
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
    font-weight: 500;
    color: var(--color-text-body);
  }
}
</style>