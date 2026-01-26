<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { Wrench } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Context Transformers" 
    description="Manage context transformation logic"
    :icon="Wrench"
    storeName="useContextTransformersStore"
  />
</template>
