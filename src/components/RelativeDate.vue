<script setup lang="ts">
import { formatDate, formatRelativeTime } from '@/composables'
import Tooltip from '@/components/Tooltip.vue'

const props = defineProps<{
  date: string | null | undefined
}>()
</script>

<template>
  <Tooltip v-if="props.date" :text="formatDate(props.date)">
    {{ formatRelativeTime(props.date) }}
  </Tooltip>
  <span v-else>N/A</span>
</template>
