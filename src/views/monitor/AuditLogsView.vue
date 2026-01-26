<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import { ClipboardList } from 'lucide-vue-next'
</script>
<template>
  <PlaceholderView 
    title="Audit Logs" 
    description="View system audit trail"
    :icon="ClipboardList"
    storeName="useAuditLogsStore"
  />
</template>
