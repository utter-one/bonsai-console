<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProjectsStore } from '@/stores'

const props = withDefaults(defineProps<{
  /** Placeholder text for the default option */
  placeholder?: string
  /** Disable the select */
  disabled?: boolean
}>(), {
  placeholder: 'Select a project',
})

const model = defineModel<string>({ required: true })

const projectsStore = useProjectsStore()

onMounted(() => {
  if (projectsStore.items.length === 0) {
    projectsStore.fetchAll({ orderBy: 'name' })
  }
})

const options = computed(() =>
  projectsStore.items
    .filter(p => !p.archivedAt)
    .map(p => ({ label: p.name, value: p.id }))
)
</script>

<template>
  <select
    :value="model"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    class="form-select"
    :disabled="disabled"
  >
    <option value="" disabled>
      {{ placeholder }}
    </option>
    <option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>
