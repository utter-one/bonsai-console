<script setup lang="ts">
import PlaceholderView from '@/components/PlaceholderView.vue'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import { ClipboardList } from 'lucide-vue-next'
</script>
<template>
  <MonitorSectionLayout>
    <PlaceholderView 
      title="Audit Logs" 
      description="View system audit trail"
      :icon="ClipboardList"
      storeName="useAuditLogsStore"
    />
  </MonitorSectionLayout>
</template>
