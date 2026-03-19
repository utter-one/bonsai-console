<template>
  <div class="modal-overlay">
    <div class="modal-content-lg" @click.stop>
      <h2 class="modal-header">{{ category ? 'Edit Category' : 'New Category' }}</h2>

      <div v-if="category" class="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav class="tabs-nav">
          <button @click="activeTab = 'details'" :class="['tab-button', { 'tab-button-active': activeTab === 'details' }]" type="button">Details</button>
          <button v-if="loadHistory" @click="activeTab = 'history'" :class="['tab-button', { 'tab-button-active': activeTab === 'history' }]" type="button">History</button>
        </nav>
      </div>

      <div v-if="isReadOnly" class="alert-warning mb-4">
        This category is read-only because the project is archived.
      </div>

      <div v-show="!category || activeTab === 'details'">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">Name <span class="required">*</span></label>
          <input
            v-model="form.name"
            type="text"
            required
            class="form-input"
            placeholder="Category name"
            :disabled="disabled"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Prompt Trigger <span class="required">*</span></label>
          <input
            v-model="form.promptTrigger"
            type="text"
            required
            class="form-input"
            placeholder="e.g. When the user asks about pricing..."
            :disabled="disabled"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Phrase that activates this knowledge category in conversations
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">Knowledge Tags</label>
          <input
            v-model="tagsInput"
            type="text"
            class="form-input"
            placeholder="billing, pricing, plans"
            :disabled="disabled"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Comma-separated tags for this category
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">Display Order</label>
          <input
            v-model.number="form.order"
            type="number"
            min="0"
            class="form-input max-w-32"
            :disabled="disabled"
          />
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button v-if="!disabled" type="submit" class="btn-primary">
            {{ category ? 'Save Changes' : 'Create Category' }}
          </button>
        </div>
      </form>
      </div>

      <div v-if="category" v-show="activeTab === 'history'">
        <EntityHistoryView
          v-if="loadHistory"
          :load-history="loadHistory"
          :current-object="category"
          :current-version="category.version"
          :active="activeTab === 'history'"
          :update-fn="updateFn"
          :create-fn="createFn"
          :ignore-fields="['archived', 'updatedAt', 'version', 'items']"
          @recover-success="emit('recoverSuccess')"
        />
        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import type { KnowledgeCategoryResponse } from '@/api/types'
import EntityHistoryView from '@/components/EntityHistoryView.vue'

const props = defineProps<{
  category: KnowledgeCategoryResponse | null
  loadHistory?: () => Promise<any>
  updateFn?: (data: any) => Promise<any>
  createFn?: (data: any) => Promise<any>
}>()

const emit = defineEmits<{
  close: []
  save: [data: { name: string; promptTrigger: string; tags: string[]; order: number }]
  recoverSuccess: []
}>()

const activeTab = ref<'details' | 'history'>('details')

watch(() => props.category, () => {
  activeTab.value = 'details'
})

const form = ref({
  name: '',
  promptTrigger: '',
  order: 0,
})

const disabled = computed(() => isReadOnly.value || projectIsArchived.value)

const tagsInput = ref('')

const { projectIsArchived, isReadOnly } = useProjectReadOnly(props.category)

const parsedTags = computed(() =>
  tagsInput.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean),
)

watch(
  () => props.category,
  (cat) => {
    if (cat) {
      form.value = {
        name: cat.name,
        promptTrigger: cat.promptTrigger,
        order: cat.order,
      }
      tagsInput.value = cat.tags.join(', ')
    } else {
      form.value = { name: '', promptTrigger: '', order: 0 }
      tagsInput.value = ''
    }
  },
  { immediate: true },
)

function handleSubmit() {
  emit('save', {
    name: form.value.name,
    promptTrigger: form.value.promptTrigger,
    tags: parsedTags.value,
    order: form.value.order,
  })
}
</script>
