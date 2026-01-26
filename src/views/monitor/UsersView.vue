<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { Users } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Users" 
    description="View and manage users"
    :icon="Users"
    storeName="useUsersStore"
  />
</template>
