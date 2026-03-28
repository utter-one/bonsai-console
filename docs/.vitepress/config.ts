import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Bonsai Console Help',
  description: 'Documentation and help for the Bonsai Console admin panel',
  base: '/help/',
  outDir: '../dist/help',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Design', link: '/design/' },
      { text: 'Monitor', link: '/monitor/' },
      { text: 'Administration', link: '/administration/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'What is Bonsai?', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
            { text: 'Navigating the Console', link: '/guide/navigation' },
          ],
        },
        {
          text: 'Testing',
          items: [
            { text: 'Playground', link: '/guide/playground' },
          ],
        },
        {
          text: 'Advanced Topics',
          items: [
            { text: 'Project Design Guide', link: '/guide/project-design' },
            { text: 'Prompt Templating', link: '/guide/templating' },
            { text: 'Scripting', link: '/guide/scripting' },
          ],
        },
      ],
      '/design/': [
        {
          text: 'Design Your AI',
          items: [
            { text: 'Overview', link: '/design/' },
            { text: 'Agents', link: '/design/agents' },
            { text: 'Stages', link: '/design/stages' },
            { text: 'Actions & Effects', link: '/design/actions' },
            { text: 'Classifiers', link: '/design/classifiers' },
            { text: 'Context Transformers', link: '/design/context-transformers' },
            { text: 'Global Actions', link: '/design/global-actions' },
            { text: 'Guardrails', link: '/design/guardrails' },
            { text: 'Moderation', link: '/design/moderation' },
            { text: 'Tools', link: '/design/tools' },
            { text: 'Knowledge Base', link: '/design/knowledge' },
            { text: 'Global Memory', link: '/design/global-memory' },
            { text: 'Sample Copies', link: '/design/sample-copies' },
          ],
        },
      ],
      '/monitor/': [
        {
          text: 'Monitor & Observe',
          items: [
            { text: 'Overview', link: '/monitor/' },
            { text: 'Conversations', link: '/monitor/conversations' },
            { text: 'Users', link: '/monitor/users' },
            { text: 'Issues', link: '/monitor/issues' },
            { text: 'Analytics (Experimental)', link: '/monitor/analytics' },
            { text: 'Audit Logs', link: '/monitor/audit-logs' },
          ],
        },
      ],
      '/administration/': [
        {
          text: 'Platform Management',
          items: [
            { text: 'Overview', link: '/administration/' },
            { text: 'Projects', link: '/administration/projects' },
            { text: 'Environments', link: '/administration/environments' },
            { text: 'Operators & Roles', link: '/administration/operators' },
            { text: 'API Keys', link: '/administration/api-keys' },
            { text: 'Providers', link: '/administration/providers' },
          ],
        },
      ],
    },

    socialLinks: [],

    footer: {
      message: 'Bonsai Console Help',
    },

    search: {
      provider: 'local',
    },
  },
})
