import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

const router = new Router({
  scrollBehavior: () => ({ x: 0, y: 0}),
  routes: [
    {
      path: '/commodity-1',
      name: 'CommodityOne',
      component: () => import('@/views/CommodityOne'),
      meta: { title: '商品1' }
    }
  ]
});

export default router;