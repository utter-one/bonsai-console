<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import { Bot } from 'lucide-vue-next'
</script>
<template>
  <AdministrationSectionLayout>
    <PlaceholderView 
      title="Providers" 
      description="Configure AI providers"
      :icon="Bot"
      storeName="useProvidersStore"
    />
  </AdministrationSectionLayout>
</template>
