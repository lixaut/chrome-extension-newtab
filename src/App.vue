<template>
  <HomePage />
</template>

<script setup lang="ts">
import { useRem } from '@/utils/useRem';
import HomePage from '@/views/homePage/index.vue';
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
