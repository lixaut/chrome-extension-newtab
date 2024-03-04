<template>
  <div class="home-page">
    <CardBox width="5rem" height="2rem">
      <template #content>
        <span class="time">23:12:01</span>
      </template>
    </CardBox>
  </div>
</template>

<script setup lang="ts">
import { defineOptions } from 'vue';
import CardBox from '@/components/CardBox/index.vue';
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
    display: inline-block;
    width: 100%;
    height: 1.4rem;
    font-size: 1.4rem;
    font-family: 'font-num';
    color: #555;
  }
}
</style>
