<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { Hammer } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Tools" 
    description="Configure available tools"
    :icon="Hammer"
    storeName="useToolsStore"
  />
</template>
