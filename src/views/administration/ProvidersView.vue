<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import SectionLayout from '@/layouts/SectionLayout.vue'
import { Bot, User, Settings } from 'lucide-vue-next'

const menuItems = [
  { name: 'administration.admins', label: 'Admins', icon: User },
  { name: 'administration.providers', label: 'Providers', icon: Settings },
]
</script>
<template>
  <SectionLayout title="Administration" :menu-items="menuItems">
    <PlaceholderView 
      title="Providers" 
      description="Configure AI providers"
      :icon="Bot"
      storeName="useProvidersStore"
    />
  </SectionLayout>
</template>
