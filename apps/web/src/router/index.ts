import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { public: true, title: 'Login' }
    },
    {
      path: '/',
      name: 'Layout',
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: 'Dashboard', icon: 'Odometer' }
        },
        {
          path: 'rules',
          name: 'Rules',
          component: () => import('@/views/rules/index.vue'),
          meta: { title: 'Rules', icon: 'SetUp' }
        },
        {
          path: 'rules/create',
          name: 'CreateRule',
          component: () => import('@/views/rules/form.vue'),
          meta: { title: 'Create Rule', hidden: true }
        },
        {
          path: 'rules/edit/:id',
          name: 'EditRule',
          component: () => import('@/views/rules/form.vue'),
          meta: { title: 'Edit Rule', hidden: true }
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/users/index.vue'),
          meta: { title: 'Users', icon: 'User' }
        },
        {
          path: 'roles',
          name: 'Roles',
          component: () => import('@/views/roles/index.vue'),
          meta: { title: 'Roles', icon: 'Lock' }
        },
        {
          path: 'logs',
          name: 'Logs',
          component: () => import('@/views/logs/index.vue'),
          meta: { title: 'Logs', icon: 'Document' }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/error/404.vue')
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  document.title = (to.meta.title as string) || '智能派单系统'
  
  // 公开页面直接访问
  if (to.meta.public) {
    next()
    return
  }
  
  // 检查是否已登录
  if (!userStore.isLoggedIn) {
    next('/login')
    return
  }
  
  // 获取用户信息（如果还没有）
  if (!userStore.userInfo) {
    try {
      await userStore.getUserInfo()
    } catch {
      userStore.logout()
      next('/login')
      return
    }
  }
  
  next()
})

export default router
