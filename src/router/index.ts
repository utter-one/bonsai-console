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
            path: 'projects/:projectId/agents',
            name: 'design.agents',
            component: () => import('@/views/design/AgentsView.vue'),
          },
          {
            path: 'projects/:projectId/agents/new',
            name: 'design.agents.create',
            component: () => import('@/views/design/AgentEditView.vue'),
          },
          {
            path: 'projects/:projectId/agents/:agentId',
            name: 'design.agents.edit',
            component: () => import('@/views/design/AgentEditView.vue'),
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
            path: 'projects/:projectId/guardrails',
            name: 'design.guardrails',
            component: () => import('@/views/design/GuardrailsView.vue'),
          },
          {
            path: 'projects/:projectId/moderation',
            name: 'design.moderation',
            redirect: (to) => ({ name: 'design.guardrails', params: to.params }),
          },
          {
            path: 'projects/:projectId/guardrails/new',
            name: 'design.guardrails.create',
            component: () => import('@/views/design/GuardrailEditView.vue'),
          },
          {
            path: 'projects/:projectId/guardrails/:guardrailId',
            name: 'design.guardrails.edit',
            component: () => import('@/views/design/GuardrailEditView.vue'),
          },
          {
            path: 'projects/:projectId/knowledge',
            name: 'design.knowledge',
            component: () => import('@/views/design/KnowledgeView.vue'),
          },
          {
            path: 'projects/:projectId/global-memory',
            name: 'design.globalMemory',
            component: () => import('@/views/design/GlobalMemoryView.vue'),
          },
          {
            path: 'projects/:projectId/sample-copies',
            name: 'design.sampleCopies',
            component: () => import('@/views/design/SampleCopiesView.vue'),
          },
        ],
      },
      // Playground Section
      {
        path: 'playground/:projectId?',
        name: 'playground',
        component: () => import('@/views/PlaygroundView.vue'),
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
            path: 'analytics',
            name: 'monitor.analytics',
            component: () => import('@/views/monitor/AnalyticsView.vue'),
            redirect: { name: 'monitor.analytics.latency' },
            children: [
              {
                path: 'latency',
                name: 'monitor.analytics.latency',
                component: () => import('@/views/monitor/LatencyAnalysisView.vue'),
              },
              {
                path: 'token-usage',
                name: 'monitor.analytics.tokenUsage',
                component: () => import('@/views/monitor/TokenUsageAnalysisView.vue'),
              },
              {
                path: 'explore',
                name: 'monitor.analytics.explore',
                component: () => import('@/views/monitor/ExploreView.vue'),
              },
              {
                path: 'funnels',
                name: 'monitor.analytics.funnels',
                component: () => import('@/views/monitor/FunnelView.vue'),
              },
            ],
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
            path: 'projects/new',
            name: 'administration.projects.create',
            component: () => import('@/views/administration/ProjectEditView.vue'),
          },
          {
            path: 'projects/:projectId',
            name: 'administration.projects.edit',
            component: () => import('@/views/administration/ProjectEditView.vue'),
          },
          {
            path: 'api-keys',
            name: 'administration.apiKeys',
            component: () => import('@/views/administration/ApiKeysView.vue'),
          },
          {
            path: 'operators',
            name: 'administration.operators',
            component: () => import('@/views/administration/OperatorsView.vue'),
          },
          {
            path: 'operators/new',
            name: 'administration.operators.create',
            component: () => import('@/views/administration/OperatorEditView.vue'),
          },
          {
            path: 'operators/:operatorId',
            name: 'administration.operators.edit',
            component: () => import('@/views/administration/OperatorEditView.vue'),
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
          {
            path: 'environments/new',
            name: 'administration.environments.create',
            component: () => import('@/views/administration/EnvironmentEditView.vue'),
          },
          {
            path: 'environments/:environmentId',
            name: 'administration.environments.edit',
            component: () => import('@/views/administration/EnvironmentEditView.vue'),
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
  } else if ((to.name === 'login' || to.name === 'setup') && authStore.isAuthenticated) {
    // Authenticated users navigating to login/setup go to dashboard instead
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
