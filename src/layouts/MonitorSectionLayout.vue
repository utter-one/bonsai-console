<script setup lang="ts">
import SectionLayout from './SectionLayout.vue'
import { MessageSquare, Users, Bug, ClipboardList } from 'lucide-vue-next'

const menuItems = [
  { name: 'monitor.conversations', label: 'Conversations', icon: MessageSquare },
  { name: 'monitor.users', label: 'Users', icon: Users },
  { name: 'monitor.issues', label: 'Issues', icon: Bug },
  { name: 'monitor.auditLogs', label: 'Audit Logs', icon: ClipboardList },
]
</script>

<template>
  <SectionLayout title="Monitor" :menu-items="menuItems">
    <slot />
  </SectionLayout>
</template>
