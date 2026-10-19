import { createRouter, createWebHistory } from 'vue-router'
import SiteLayout from '../layouts/SiteLayout.vue'
import { loadCurrentUser } from '../state/auth.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('../views/CoverView.vue'), meta: { title: '十二 · 个人博客' } },
    { path: '/admin/login', component: () => import('../views/admin/LoginView.vue') },
    {
      path: '/admin', component: () => import('../layouts/AdminLayout.vue'), meta: { requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/blogs' },
        { path: 'blogs', component: () => import('../views/admin/BlogListView.vue') },
        { path: 'blogs/new', component: () => import('../views/admin/BlogEditView.vue') },
        { path: 'blogs/:id/edit', component: () => import('../views/admin/BlogEditView.vue') },
        { path: 'types', component: () => import('../views/admin/CatalogManageView.vue'), props: { resource: 'types' } },
        { path: 'tags', component: () => import('../views/admin/CatalogManageView.vue'), props: { resource: 'tags' } },
        { path: 'notices', component: () => import('../views/admin/ResourceManageView.vue'), props: { resource: 'notices' } },
        { path: 'pictures', component: () => import('../views/admin/ResourceManageView.vue'), props: { resource: 'pictures' } },
        { path: 'friend-links', component: () => import('../views/admin/ResourceManageView.vue'), props: { resource: 'friend-links' } },
        { path: 'comments', component: () => import('../views/admin/DiscussionManageView.vue'), props: { resource: 'comments' } },
        { path: 'messages', component: () => import('../views/admin/DiscussionManageView.vue'), props: { resource: 'messages' } },
        { path: 'navigation', component: () => import('../views/admin/NavigationManageView.vue') },
      ],
    },
    {
      path: '/', component: SiteLayout, children: [
        { path: 'home', component: () => import('../views/HomeView.vue') },
        { path: 'home-layouts', component: () => import('../views/HomeLayoutsView.vue') },
        { path: 'blog/:id', component: () => import('../views/BlogDetailView.vue') },
        { path: 'types', component: () => import('../views/TypesView.vue') },
        { path: 'type/:id', component: () => import('../views/BlogListView.vue'), meta: { filter: 'typeId', title: '分类文章' } },
        { path: 'tag/:id', component: () => import('../views/BlogListView.vue'), meta: { filter: 'tagId', title: '标签文章' } },
        { path: 'archives', component: () => import('../views/ArchivesView.vue') },
        { path: 'archive/:year', component: () => import('../views/BlogListView.vue'), meta: { filter: 'year', title: '文章归档' } },
        { path: 'search', component: () => import('../views/BlogListView.vue'), meta: { title: '搜索文章' } },
        { path: 'album', name: 'extra-album', component: () => import('../views/AlbumView.vue') },
        { path: 'messages', name: 'extra-messages', alias: '/message', component: () => import('../views/MessagesView.vue') },
        { path: 'albumArchive/:date', component: () => import('../views/AlbumView.vue') },
        { path: 'picture/:id', component: () => import('../views/PictureView.vue') },
        { path: 'picture', redirect: '/album' },
        { path: 'friend-links', name: 'extra-friend-links', component: () => import('../views/FriendLinksView.vue') },
        { path: 'about', name: 'extra-about', alias: '/aboutme', component: () => import('../views/AboutView.vue') },
        { path: 'about-web', name: 'extra-about-web', alias: '/aboutWeb', component: () => import('../views/AboutView.vue'), meta: { aboutSite: true } },
        { path: ':pathMatch(.*)*', component: () => import('../views/NotFoundView.vue') },
      ],
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

router.beforeEach(async to => {
  if (!to.meta.requiresAdmin) return
  try { await loadCurrentUser() }
  catch (error) {
    const reason = error.status === 401 ? undefined : error.status === 403 ? 'forbidden' : 'unavailable'
    return { path: '/admin/login', query: { redirect: to.fullPath, ...(reason ? { reason } : {}) } }
  }
})

export default router
