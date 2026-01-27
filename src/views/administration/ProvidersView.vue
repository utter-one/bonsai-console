<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { Bot } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Providers" 
    description="Configure AI providers"
    :icon="Bot"
    storeName="useProvidersStore"
  />
</template>
