<template>
  <HomePage />
</template>

<script setup lang="ts">
import { useRem } from '@/utils/useRem.js';
import HomePage from './views/HomePage.vue';
import { onMounted, onUnmounted } from 'vue';

const rem = useRem();

onMounted(() => {
  rem.addRem();
});

onUnmounted(() => {
  rem.removeRem();
});
</script>

<style lang="scss" scoped></style>
