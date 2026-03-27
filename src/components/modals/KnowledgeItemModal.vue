<template>
  <BaseModal :title="item ? 'Edit Knowledge Item' : 'New Knowledge Item'" size="xl" @close="$emit('close')">
      <div v-if="item" class="border-b border-gray-200 dark:border-gray-700 mb-4">
        <TabNavigator v-model="activeTab" :tabs="tabs" />
      </div>

      <div v-if="isReadOnly" class="alert-warning mb-4">
        This item is read-only because the project is archived.
      </div>

      <TabPanel name="details" :active-tab="!item ? 'details' : activeTab">
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
            class="form-input max-w-32"
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
      </TabPanel>

      <TabPanel v-if="item" name="history" :active-tab="activeTab">
        <EntityHistoryView
          v-if="loadHistory"
          :load-history="loadHistory"
          :current-object="item"
          :current-version="item.version"
          :active="activeTab === 'history'"
          :update-fn="updateFn"
          :create-fn="createFn"
          :ignore-fields="['archived', 'updatedAt', 'version']"
          @recover-success="emit('recoverSuccess')"
        />
        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">Close</button>
        </div>
      </TabPanel>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import type { KnowledgeItemResponse } from '@/api/types'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import BaseModal from '@/components/BaseModal.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import TabPanel from '@/components/TabPanel.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'

const props = defineProps<{
  item: KnowledgeItemResponse | null
  categoryArchived?: boolean
  loadHistory?: () => Promise<any>
  updateFn?: (data: any) => Promise<any>
  createFn?: (data: any) => Promise<any>
}>()

const emit = defineEmits<{
  close: []
  save: [data: { question: string; answer: string; order: number }]
  recoverSuccess: []
}>()

const activeTab = ref<'details' | 'history'>('details')

const tabs = computed<TabDefinition[]>(() => [
  { key: 'details', label: 'Details' },
  { key: 'history', label: 'History', show: !!props.loadHistory },
])

watch(() => props.item, () => {
  activeTab.value = 'details'
})

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
