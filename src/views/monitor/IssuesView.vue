<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { Bug } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Issues" 
    description="Track and manage system issues"
    :icon="Bug"
    storeName="useIssuesStore"
  />
</template>
