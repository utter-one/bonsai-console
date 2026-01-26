<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { Globe } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Environments" 
    description="Configure deployment environments"
    :icon="Globe"
    storeName="useEnvironmentsStore"
  />
</template>
