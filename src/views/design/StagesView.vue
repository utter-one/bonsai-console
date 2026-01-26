<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { RefreshCw } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Stages" 
    description="Define conversation stages"
    :icon="RefreshCw"
    storeName="useStagesStore"
  />
</template>
