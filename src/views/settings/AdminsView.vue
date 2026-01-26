<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { User } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Administrators" 
    description="Manage admin users and permissions"
    :icon="User"
    storeName="useAdminsStore"
  />
</template>
