<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import { Bug } from 'lucide-vue-next'
</script>
<template>
  <MonitorSectionLayout>
    <PlaceholderView 
      title="Issues" 
      description="Track and manage system issues"
      :icon="Bug"
      storeName="useIssuesStore"
    />
  </MonitorSectionLayout>
</template>
