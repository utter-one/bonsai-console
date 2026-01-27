<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import { Users } from 'lucide-vue-next'
</script>
<template>
  <MonitorSectionLayout>
    <PlaceholderView 
      title="Users" 
      description="View and manage users"
      :icon="Users"
      storeName="useUsersStore"
    />
  </MonitorSectionLayout>
</template>
