<script setup lang="ts">
import SectionLayout from './SectionLayout.vue'
import { BriefcaseBusiness, User, Settings, Globe } from 'lucide-vue-next'

const menuItems = [
  { name: 'administration.projects', label: 'Projects', icon: BriefcaseBusiness },
  { name: 'administration.admins', label: 'Admins', icon: User },
  { name: 'administration.providers', label: 'Providers', icon: Settings },
  { name: 'administration.environments', label: 'Environments', icon: Globe },
]
</script>

<template>
  <SectionLayout title="Administration" :menu-items="menuItems">
    <slot />
  </SectionLayout>
</template>
