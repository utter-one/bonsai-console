<script setup lang="ts">
import { formatDate, formatRelativeTime } from '@/composables'

const props = defineProps<{
  date: string | null | undefined
}>()
</script>

<template>
  <span v-if="props.date" class="relative-date">
    {{ formatRelativeTime(props.date) }}
    <span class="relative-date-tooltip">{{ formatDate(props.date) }}</span>
  </span>
  <span v-else>N/A</span>
</template>
