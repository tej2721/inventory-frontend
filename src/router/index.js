import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/',
      redirect: '/products',
    },
    {
      path: '/products',
      component: () => import('../views/ProductsView.vue'),
    },
    {
      path: '/orders',
      component: () => import('../views/OrdersView.vue'),
    },
  ],
})

export default router