import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Bonsai Console Help',
  description: 'Documentation and help for the Bonsai Console admin panel',
  base: '/help/',

  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Design', link: '/design/' },
      { text: 'Monitor', link: '/monitor/' },
      { text: 'Administration', link: '/administration/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Bonsai Console?', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Navigation', link: '/guide/navigation' },
          ],
        },
      ],
      '/design/': [
        {
          text: 'Design',
          items: [
            { text: 'Overview', link: '/design/' },
            { text: 'Personas', link: '/design/personas' },
            { text: 'Stages', link: '/design/stages' },
            { text: 'Classifiers', link: '/design/classifiers' },
            { text: 'Actions', link: '/design/actions' },
            { text: 'Tools', link: '/design/tools' },
            { text: 'Knowledge', link: '/design/knowledge' },
          ],
        },
      ],
      '/monitor/': [
        {
          text: 'Monitor',
          items: [
            { text: 'Overview', link: '/monitor/' },
            { text: 'Conversations', link: '/monitor/conversations' },
            { text: 'Users', link: '/monitor/users' },
            { text: 'Issues', link: '/monitor/issues' },
            { text: 'Audit Logs', link: '/monitor/audit-logs' },
          ],
        },
      ],
      '/administration/': [
        {
          text: 'Administration',
          items: [
            { text: 'Overview', link: '/administration/' },
            { text: 'Projects', link: '/administration/projects' },
            { text: 'Environments', link: '/administration/environments' },
            { text: 'Admins', link: '/administration/admins' },
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
