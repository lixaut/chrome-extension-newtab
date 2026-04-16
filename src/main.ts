import '@/style/index.scss';
// 引入全局指令
import fadeLoading from './directives/fadeLoading';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.directive('fade-loading', fadeLoading);

app.mount('#app');
