<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import { Globe } from 'lucide-vue-next'
</script>
<template>
  <AdministrationSectionLayout>
    <PlaceholderView 
      title="Environments" 
      description="Configure deployment environments"
      :icon="Globe"
      storeName="useEnvironmentsStore"
    />
  </AdministrationSectionLayout>
</template>
