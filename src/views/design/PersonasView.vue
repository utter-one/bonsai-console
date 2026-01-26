<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { Drama } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Personas" 
    description="Configure AI personas"
    :icon="Drama"
    storeName="usePersonasStore"
  />
</template>
