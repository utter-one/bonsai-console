<template>
  <div class="form-group">
    <label class="form-label">
      Tags <span class="text-gray-500">(optional)</span>
    </label>
    <div v-if="modelValue.length > 0" class="tag-list mb-2">
      <span
        v-for="(tag, index) in modelValue"
        :key="index"
        class="tag-item"
      >
        {{ tag }}
        <button
          type="button"
          @click="removeTag(index)"
          class="ml-0.5 hover:text-violet-600 dark:hover:text-violet-400"
          :disabled="disabled"
        >
          <X class="w-3 h-3" />
        </button>
      </span>
    </div>
    <div class="flex gap-2">
      <input
        v-model="tagInput"
        type="text"
        placeholder="Add a tag..."
        class="form-input max-w-64"
        :disabled="disabled"
        @keydown="handleKeydown"
      />
      <button
        type="button"
        @click="addTag"
        class="btn-secondary whitespace-nowrap"
        :disabled="disabled || !tagInput.trim()"
      >
        Add
      </button>
    </div>
    <p class="form-help-text">{{ helpText }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue: string[]
  disabled?: boolean
  helpText?: string
}>(), {
  disabled: false,
  helpText: 'Tags for categorizing and filtering. Press Enter or comma to add a tag.'
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const tagInput = ref('')

function addTag() {
  const value = tagInput.value.replace(/,$/, '').trim()
  if (value && !props.modelValue.includes(value)) {
    emit('update:modelValue', [...props.modelValue, value])
  }
  tagInput.value = ''
}

function removeTag(index: number) {
  const updated = [...props.modelValue]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTag()
  }
}
</script>
