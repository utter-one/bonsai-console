<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">{{ item ? 'Edit Knowledge Item' : 'New Knowledge Item' }}</h2>
      <div v-if="isReadOnly" class="alert-warning mb-4">
        This item is read-only because the project is archived.
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">Question <span class="required">*</span></label>
          <input
            v-model="form.question"
            type="text"
            required
            class="form-input"
            placeholder="What is the question the user might ask?"
            :disabled="disabled"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Answer <span class="required">*</span></label>
          <textarea
            v-model="form.answer"
            required
            class="form-textarea"
            rows="5"
            placeholder="Provide the answer that the assistant should give..."
            :disabled="disabled"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Display Order</label>
          <input
            v-model.number="form.order"
            type="number"
            min="0"
            class="form-input"
            :disabled="disabled"
          />
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button v-if="!disabled" type="submit" class="btn-primary">
            {{ item ? 'Save Changes' : 'Create Item' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import type { KnowledgeItemResponse } from '@/api/types'

const props = defineProps<{
  item: KnowledgeItemResponse | null
  categoryArchived?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: { question: string; answer: string; order: number }]
}>()

const form = ref({
  question: '',
  answer: '',
  order: 0,
})

const { projectIsArchived, isReadOnly } = useProjectReadOnly(props.item)

const disabled = computed(
  () => isReadOnly.value || projectIsArchived.value || !!props.categoryArchived
)

watch(
  () => props.item,
  (i) => {
    if (i) {
      form.value = { question: i.question, answer: i.answer, order: i.order }
    } else {
      form.value = { question: '', answer: '', order: 0 }
    }
  },
  { immediate: true },
)

function handleSubmit() {
  emit('save', {
    question: form.value.question,
    answer: form.value.answer,
    order: form.value.order,
  })
}
</script>
