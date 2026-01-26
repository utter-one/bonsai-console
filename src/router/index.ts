import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/setup',
    name: 'setup',
    component: () => import('@/views/auth/SetupView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
      },
      // Design Section
      {
        path: 'design',
        name: 'design',
        redirect: { name: 'design.projects' },
        children: [
          {
            path: 'projects',
            name: 'design.projects',
            component: () => import('@/views/design/ProjectsView.vue'),
          },
          {
            path: 'projects/:projectId/personas',
            name: 'design.personas',
            component: () => import('@/views/design/PersonasView.vue'),
          },
          {
            path: 'projects/:projectId/stages',
            name: 'design.stages',
            component: () => import('@/views/design/StagesView.vue'),
          },
          {
            path: 'projects/:projectId/classifiers',
            name: 'design.classifiers',
            component: () => import('@/views/design/ClassifiersView.vue'),
          },
          {
            path: 'projects/:projectId/context-transformers',
            name: 'design.contextTransformers',
            component: () => import('@/views/design/ContextTransformersView.vue'),
          },
          {
            path: 'projects/:projectId/tools',
            name: 'design.tools',
            component: () => import('@/views/design/ToolsView.vue'),
          },
          {
            path: 'projects/:projectId/global-actions',
            name: 'design.globalActions',
            component: () => import('@/views/design/GlobalActionsView.vue'),
          },
          {
            path: 'projects/:projectId/knowledge',
            name: 'design.knowledge',
            component: () => import('@/views/design/KnowledgeView.vue'),
          },
          {
            path: 'projects/:projectId/providers',
            name: 'design.providers',
            component: () => import('@/views/design/ProvidersView.vue'),
          },
          {
            path: 'projects/:projectId/environments',
            name: 'design.environments',
            component: () => import('@/views/design/EnvironmentsView.vue'),
          },
        ],
      },
      // Monitor Section
      {
        path: 'monitor',
        name: 'monitor',
        redirect: { name: 'monitor.conversations' },
        children: [
          {
            path: 'conversations',
            name: 'monitor.conversations',
            component: () => import('@/views/monitor/ConversationsView.vue'),
          },
          {
            path: 'conversations/:conversationId',
            name: 'monitor.conversationDetail',
            component: () => import('@/views/monitor/ConversationDetailView.vue'),
          },
          {
            path: 'users',
            name: 'monitor.users',
            component: () => import('@/views/monitor/UsersView.vue'),
          },
          {
            path: 'issues',
            name: 'monitor.issues',
            component: () => import('@/views/monitor/IssuesView.vue'),
          },
          {
            path: 'audit-logs',
            name: 'monitor.auditLogs',
            component: () => import('@/views/monitor/AuditLogsView.vue'),
          },
        ],
      },
      // Analyze Section
      {
        path: 'analyze',
        name: 'analyze',
        redirect: { name: 'analyze.conversations' },
        children: [
          {
            path: 'conversations',
            name: 'analyze.conversations',
            component: () => import('@/views/analyze/ConversationAnalyticsView.vue'),
          },
          {
            path: 'issues',
            name: 'analyze.issues',
            component: () => import('@/views/analyze/IssueAnalyticsView.vue'),
          },
          {
            path: 'performance',
            name: 'analyze.performance',
            component: () => import('@/views/analyze/PerformanceView.vue'),
          },
          {
            path: 'audit',
            name: 'analyze.audit',
            component: () => import('@/views/analyze/AuditReportsView.vue'),
          },
        ],
      },
      // Settings Section
      {
        path: 'settings',
        name: 'settings',
        redirect: { name: 'settings.admins' },
        children: [
          {
            path: 'admins',
            name: 'settings.admins',
            component: () => import('@/views/settings/AdminsView.vue'),
          },
          {
            path: 'profile',
            name: 'settings.profile',
            component: () => import('@/views/settings/ProfileView.vue'),
          },
        ],
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth !== false)

  // Always check setup status first (except when already on setup page)
  if (to.name !== 'setup') {
    try {
      const status = await authStore.checkSetupStatus()
      if (!status.isSetup) {
        // Setup is incomplete, redirect to setup
        next({ name: 'setup' })
        return
      }
    } catch (error) {
      // If setup check fails, log and continue (assume setup is complete)
      console.warn('Failed to check setup status:', error)
    }
  }

  // Handle authentication for protected routes
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (!requiresAuth && authStore.isAuthenticated && to.name !== 'dashboard') {
    // If authenticated and trying to access login/setup, redirect to dashboard
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
