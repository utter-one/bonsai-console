<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { MessageCircle } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Conversation Details" 
    description="View conversation events and timeline"
    :icon="MessageCircle"
    storeName="useConversationsStore"
  />
</template>
