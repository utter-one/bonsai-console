<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import { MessageSquare } from 'lucide-vue-next'
</script>
<template>
  <MonitorSectionLayout>
    <PlaceholderView 
      title="Conversations" 
      description="Monitor active and past conversations"
      :icon="MessageSquare"
      storeName="useConversationsStore"
    />
  </MonitorSectionLayout>
</template>
