import router from './index.js';
import getPageTitle from '@/utils/get-page-title.js';

router.beforeEach((to, from, next) => {
  document.title = getPageTitle(to.meta.title);
  next();
});