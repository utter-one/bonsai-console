import { computed } from 'vue'
import { useRoute } from 'vue-router'

const HELP_BASE = '/help'

const ROUTE_HELP_MAP: Record<string, string> = {
  // Guide
  dashboard:                              '/guide/index',
  playground:                             '/guide/playground',

  // Design — Agents
  'design':                               '/design/',
  'design.agents':                        '/design/agents',
  'design.agents.create':                '/design/agents',
  'design.agents.edit':                  '/design/agents',

  // Design — Stages
  'design.stages':                        '/design/stages',
  'design.stages.create':               '/design/stages',
  'design.stages.edit':                  '/design/stages',

  // Design — Actions
  'design.globalActions':                '/design/global-actions',
  'design.globalActions.create':        '/design/global-actions',
  'design.globalActions.edit':          '/design/global-actions',

  // Design — Guardrails
  'design.guardrails':                   '/design/guardrails',
  'design.guardrails.create':           '/design/guardrails',
  'design.guardrails.edit':             '/design/guardrails',
  'design.moderation':                   '/design/guardrails',

  // Design — Classifiers
  'design.classifiers':                  '/design/classifiers',
  'design.classifiers.create':          '/design/classifiers',
  'design.classifiers.edit':            '/design/classifiers',

  // Design — Context Transformers
  'design.contextTransformers':          '/design/context-transformers',
  'design.contextTransformers.create': '/design/context-transformers',
  'design.contextTransformers.edit':   '/design/context-transformers',

  // Design — Tools
  'design.tools':                        '/design/tools',
  'design.tools.create':               '/design/tools',
  'design.tools.edit':                  '/design/tools',

  // Design — Knowledge
  'design.knowledge':                    '/design/knowledge',

  // Design — Global Memory
  'design.globalMemory':                 '/design/global-memory',

  // Design — Sample Copies
  'design.sampleCopies':                 '/design/sample-copies',

  // Monitor
  'monitor':                             '/monitor/',
  'monitor.conversations':              '/monitor/conversations',
  'monitor.conversationDetail':         '/monitor/conversations',
  'monitor.users':                       '/monitor/users',
  'monitor.userDetail':                  '/monitor/users',
  'monitor.issues':                      '/monitor/issues',
  'monitor.auditLogs':                   '/monitor/audit-logs',
  'monitor.auditLogDetail':             '/monitor/audit-logs',
  'monitor.analytics':                   '/monitor/analytics',
  'monitor.analytics.latency':          '/monitor/analytics',
  'monitor.analytics.tokenUsage':       '/monitor/analytics',
  'monitor.analytics.explore':          '/monitor/analytics',

  // Administration
  'administration':                      '/administration/',
  'administration.projects':            '/administration/projects',
  'administration.projects.create':    '/administration/projects',
  'administration.projects.edit':      '/administration/projects',
  'administration.environments':        '/administration/environments',
  'administration.environments.create': '/administration/environments',
  'administration.environments.edit':  '/administration/environments',
  'administration.operators':              '/administration/operators',
  'administration.operators.create':      '/administration/operators',
  'administration.operators.edit':        '/administration/operators',
  'administration.apiKeys':             '/administration/api-keys',
  'administration.providers':           '/administration/providers',
  'administration.providers.create':   '/administration/providers',
  'administration.providers.edit':     '/administration/providers',
}

export function useContextualHelp() {
  const route = useRoute()

  const helpUrl = computed(() => {
    const routeName = route.name as string | undefined
    if (routeName && ROUTE_HELP_MAP[routeName]) {
      return `${HELP_BASE}${ROUTE_HELP_MAP[routeName]}.html`
    }
    return `${HELP_BASE}/guide/`
  })

  return { helpUrl }
}
