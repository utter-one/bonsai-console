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
        component: () => import('@/views/design/DesignView.vue'),
        children: [
          {
            path: 'projects/:projectId/stages',
            name: 'design.stages',
            component: () => import('@/views/design/StagesView.vue'),
          },
          {
            path: 'projects/:projectId/stages/new',
            name: 'design.stages.create',
            component: () => import('@/views/design/StageEditView.vue'),
          },
          {
            path: 'projects/:projectId/stages/:stageId',
            name: 'design.stages.edit',
            component: () => import('@/views/design/StageEditView.vue'),
          },
          {
            path: 'projects/:projectId/personas',
            name: 'design.personas',
            component: () => import('@/views/design/PersonasView.vue'),
          },
          {
            path: 'projects/:projectId/personas/new',
            name: 'design.personas.create',
            component: () => import('@/views/design/PersonaEditView.vue'),
          },
          {
            path: 'projects/:projectId/personas/:personaId',
            name: 'design.personas.edit',
            component: () => import('@/views/design/PersonaEditView.vue'),
          },
          {
            path: 'projects/:projectId/classifiers',
            name: 'design.classifiers',
            component: () => import('@/views/design/ClassifiersView.vue'),
          },
          {
            path: 'projects/:projectId/classifiers/new',
            name: 'design.classifiers.create',
            component: () => import('@/views/design/ClassifierEditView.vue'),
          },
          {
            path: 'projects/:projectId/classifiers/:classifierId',
            name: 'design.classifiers.edit',
            component: () => import('@/views/design/ClassifierEditView.vue'),
          },
          {
            path: 'projects/:projectId/context-transformers',
            name: 'design.contextTransformers',
            component: () => import('@/views/design/ContextTransformersView.vue'),
          },
          {
            path: 'projects/:projectId/context-transformers/new',
            name: 'design.contextTransformers.create',
            component: () => import('@/views/design/ContextTransformerEditView.vue'),
          },
          {
            path: 'projects/:projectId/context-transformers/:transformerId',
            name: 'design.contextTransformers.edit',
            component: () => import('@/views/design/ContextTransformerEditView.vue'),
          },
          {
            path: 'projects/:projectId/tools',
            name: 'design.tools',
            component: () => import('@/views/design/ToolsView.vue'),
          },
          {
            path: 'projects/:projectId/tools/new',
            name: 'design.tools.create',
            component: () => import('@/views/design/ToolEditView.vue'),
          },
          {
            path: 'projects/:projectId/tools/:toolId',
            name: 'design.tools.edit',
            component: () => import('@/views/design/ToolEditView.vue'),
          },
          {
            path: 'projects/:projectId/global-actions',
            name: 'design.globalActions',
            component: () => import('@/views/design/GlobalActionsView.vue'),
          },
          {
            path: 'projects/:projectId/global-actions/new',
            name: 'design.globalActions.create',
            component: () => import('@/views/design/GlobalActionEditView.vue'),
          },
          {
            path: 'projects/:projectId/global-actions/:globalActionId',
            name: 'design.globalActions.edit',
            component: () => import('@/views/design/GlobalActionEditView.vue'),
          },
          {
            path: 'projects/:projectId/knowledge',
            name: 'design.knowledge',
            component: () => import('@/views/design/KnowledgeView.vue'),
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
            path: 'users/:userId',
            name: 'monitor.userDetail',
            component: () => import('@/views/monitor/UserDetailView.vue'),
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
          {
            path: 'audit-logs/:auditLogId',
            name: 'monitor.auditLogDetail',
            component: () => import('@/views/monitor/AuditLogDetailView.vue'),
          },
        ],
      },
      // Administration Section
      {
        path: 'administration',
        name: 'administration',
        redirect: { name: 'administration.projects' },
        children: [
          {
            path: 'projects',
            name: 'administration.projects',
            component: () => import('@/views/administration/ProjectsView.vue'),
          },
          {
            path: 'admins',
            name: 'administration.admins',
            component: () => import('@/views/administration/AdminsView.vue'),
          },
          {
            path: 'admins/new',
            name: 'administration.admins.create',
            component: () => import('@/views/administration/AdminEditView.vue'),
          },
          {
            path: 'admins/:adminId',
            name: 'administration.admins.edit',
            component: () => import('@/views/administration/AdminEditView.vue'),
          },
          {
            path: 'providers',
            name: 'administration.providers',
            component: () => import('@/views/administration/ProvidersView.vue'),
          },
          {
            path: 'providers/new',
            name: 'administration.providers.create',
            component: () => import('@/views/administration/ProviderEditView.vue'),
          },
          {
            path: 'providers/:providerId',
            name: 'administration.providers.edit',
            component: () => import('@/views/administration/ProviderEditView.vue'),
          },
          {
            path: 'environments',
            name: 'administration.environments',
            component: () => import('@/views/administration/EnvironmentsView.vue'),
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
  if (to.name !== 'setup' && !authStore.isAuthenticated) {
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
  } else if (requiresAuth && authStore.isAuthenticated) {
    // Ensure we have profile data when accessing protected routes
    try {
      await authStore.ensureProfile()
      next()
    } catch (error) {
      // If profile fetch fails, redirect to login
      next({ name: 'login', query: { redirect: to.fullPath } })
    }
  } else {
    next()
  }
})

export default router
