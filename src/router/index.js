import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

const router = new Router({
  scrollBehavior: () => ({ x: 0, y: 0}),
  routes: [
    {
      path: '/',
      redirect: '/index'
    },
    {
      path: '/index',
      component: () => import('@/views/index'),
      name: 'Index',
    },
    {
      path: '/commodity-1',
      component: () => import('@/views/commodity-1'),
      name: 'CommodityOne',
      meta: { title: '商品1' }
    }
  ]
});

export default router;