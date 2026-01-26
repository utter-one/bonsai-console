<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { Zap } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Global Actions" 
    description="Define system-wide actions"
    :icon="Zap"
    storeName="useGlobalActionsStore"
  />
</template>
