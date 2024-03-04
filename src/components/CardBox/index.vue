<template>
  <div class="container" :style="{ width, height }">
    <slot name="content"></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  width: string;
  height: string;
}>();
defineOptions({
  name: 'CardBox'
});
</script>

<style lang="scss" scoped>
.container {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 10px;
}
</style>
