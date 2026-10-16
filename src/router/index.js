import { createRouter, createWebHistory } from 'vue-router'
import SiteLayout from '../layouts/SiteLayout.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('../views/CoverView.vue'), meta: { title: '十二 · 个人博客' } },
    {
      path: '/', component: SiteLayout, children: [
        { path: 'home', component: () => import('../views/HomeView.vue') },
        { path: 'blog/:id', component: () => import('../views/BlogDetailView.vue') },
        { path: ':pathMatch(.*)*', component: () => import('../views/NotFoundView.vue') },
      ],
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})
