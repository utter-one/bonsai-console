<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { MessageSquare } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Conversations" 
    description="Monitor active and past conversations"
    :icon="MessageSquare"
    storeName="useConversationsStore"
  />
</template>
