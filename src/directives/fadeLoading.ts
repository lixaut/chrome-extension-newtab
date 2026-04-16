// src/directives/fadeLoading.ts
import type { Directive } from 'vue';

const fadeLoading: Directive = {
  mounted(el: HTMLElement, binding) {
    el.style.transition = 'opacity 0.8s linear, transform 0.6s ease-in-out';
    if (binding.value) {
      el.style.opacity = '0.1';
      el.style.transform = 'translateY(15px)';
    } else {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
  },
  updated(el: HTMLElement, binding) {
    if (binding.value) {
      el.style.opacity = '0.1';
      el.style.transform = 'translateY(15px)';
    } else {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
  }
};

export default fadeLoading;
