<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { Target } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Classifiers" 
    description="Configure classification rules"
    :icon="Target"
    storeName="useClassifiersStore"
  />
</template>
