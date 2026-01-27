<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import SectionLayout from '@/layouts/SectionLayout.vue'
import { BarChart, TrendingUp, Zap, FileText } from 'lucide-vue-next'

const menuItems = [
  { name: 'analyze.conversations', label: 'Conversations', icon: BarChart },
  { name: 'analyze.issues', label: 'Issues', icon: TrendingUp },
  { name: 'analyze.performance', label: 'Performance', icon: Zap },
  { name: 'analyze.audit', label: 'Audit Reports', icon: FileText },
]
</script>
<template>
  <SectionLayout title="Analyze" :menu-items="menuItems">
    <PlaceholderView 
      title="Conversation Analytics" 
      description="Analyze conversation patterns and metrics"
      :icon="BarChart"
    />
  </SectionLayout>
</template>
