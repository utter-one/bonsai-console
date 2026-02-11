<script setup lang="ts">
// Define the metadata item structure
interface MetadataField {
  label: string
  value: string | number | null | undefined
  format?: 'date' | 'mono' | 'default'
}

// Props
const props = defineProps<{
  fields: MetadataField[]
}>()

// Helper function to format dates
function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

// Helper function to format value based on type
function formatValue(field: MetadataField): string {
  if (field.value === null || field.value === undefined || field.value === '') {
    return 'N/A'
  }

  if (field.format === 'date') {
    return formatDate(field.value as string)
  }

  return String(field.value)
}

// Helper function to get value class
function getValueClass(field: MetadataField): string {
  return field.format === 'mono' ? 'metadata-value font-mono !pl-0' : 'metadata-value !pl-0'
}
</script>

<template>
  <div class="tab-content">
    <div class="metadata-container">
      <div
        v-for="(field, index) in fields"
        :key="index"
        class="metadata-item"
      >
        <span class="metadata-label">{{ field.label }}</span>
        <span :class="getValueClass(field)">{{ formatValue(field) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
