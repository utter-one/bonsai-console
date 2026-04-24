<script setup lang="ts">
import RelativeDate from './RelativeDate.vue'

// Define the metadata item structure
interface MetadataField {
  label: string
  value: string | number | null | undefined
  format?: 'date' | 'mono' | 'default'
}

// Props
const props = defineProps<{
  fields: MetadataField[]
  modelValue?: string
  tab?: string
}>()


// Helper function to format value based on type
function formatValue(field: MetadataField): string {
  if (field.value === null || field.value === undefined || field.value === '') {
    return 'N/A'
  }

  return String(field.value)
}

// Helper function to determine if field should be rendered as RelativeDate
function isDateField(field: MetadataField): boolean {
  return field.format === 'date' && field.value !== null && field.value !== undefined && field.value !== ''
}

// Helper function to get value class
function getValueClass(field: MetadataField): string {
  return field.format === 'mono' ? 'metadata-value font-mono !pl-0' : 'metadata-value !pl-0'
}
</script>

<template>
  <div
    class="tab-content"
    :data-tab="tab"
    v-show="!tab || !modelValue || modelValue === tab"
  >
    <div class="metadata-container">
      <div
        v-for="(field, index) in fields"
        :key="index"
        class="metadata-item"
      >
        <span class="metadata-label">{{ field.label }}</span>
        <span :class="getValueClass(field)">
          <RelativeDate v-if="isDateField(field)" :date="field.value as string" />
          <template v-else>{{ formatValue(field) }}</template>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
