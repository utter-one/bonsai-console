<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { BookOpen } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Knowledge Base" 
    description="Manage AI knowledge sections, categories, and items"
    :icon="BookOpen"
    storeName="useKnowledgeStore"
  />
</template>
