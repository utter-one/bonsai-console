<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content max-w-3xl" @click.stop>
      <h2 class="modal-header">
        {{ editingKey ? 'Edit Action' : 'New Action' }}
      </h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">
            Action Key <span class="required">*</span>
          </label>
          <input
            v-model="form.key"
            type="text"
            required
            placeholder="transfer_to_agent"
            :class="editingKey ? 'form-input-disabled font-mono' : 'form-input font-mono'"
            :disabled="!!editingKey"
          />
          <p class="form-help-text">
            Unique identifier for this action{{ editingKey ? ' (cannot be changed)' : '' }}
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Display Name <span class="required">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Transfer to Human Agent"
            class="form-input"
          />
          <p class="form-help-text">
            Human-readable name for this action
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">Trigger Options <span class="required">*</span></label>
          <div class="space-y-2">
            <label class="flex items-center cursor-pointer">
              <input
                v-model="form.triggerOnUserInput"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="ml-2 text-sm font-medium text-gray-700">
                Trigger on User Input
              </span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                v-model="form.triggerOnClientCommand"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="ml-2 text-sm font-medium text-gray-700">
                Trigger on Client Command
              </span>
            </label>
          </div>
          <p class="form-help-text">
            Select when this action can be triggered
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Classification Trigger <span class="text-gray-500">(optional)</span>
          </label>
          <input
            v-model="form.classificationTrigger"
            type="text"
            placeholder="transfer_request"
            class="form-input"
          />
          <p class="form-help-text">
            Classification label that triggers this action
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Override Classifier ID <span class="text-gray-500">(optional)</span>
          </label>
          <select
            v-model="form.overrideClassifierId"
            class="form-select-auto"
          >
            <option value="">No override (use stage classifiers)</option>
            <option v-for="classifier in projectClassifiers" :key="classifier.id" :value="classifier.id">
              {{ classifier.name }}
            </option>
          </select>
          <p class="form-help-text">
            Override the stage classifier for this action
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Condition <span class="text-gray-500">(optional)</span>
          </label>
          <input
            v-model="form.condition"
            type="text"
            placeholder="context.variables.agent_available === true"
            class="form-input font-mono text-sm"
          />
          <p class="form-help-text">
            Optional JavaScript condition expression for action activation
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Message Template <span class="text-gray-500">(optional)</span>
          </label>
          <textarea
            v-model="form.template"
            rows="2"
            class="form-textarea"
            placeholder="Let me connect you with an agent..."
          ></textarea>
          <p class="form-help-text">
            Optional message template to send when action is triggered
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Examples <span class="text-gray-500">(optional, one per line)</span>
          </label>
          <textarea
            v-model="form.examples"
            rows="4"
            class="form-textarea"
            placeholder="I want to speak with someone&#10;Can I talk to an agent?&#10;Transfer me to a human"
          ></textarea>
          <p class="form-help-text">
            Example phrases that should trigger this action
          </p>
        </div>

        <div class="p-4 bg-yellow-50 border border-yellow-200 rounded mb-6">
          <p class="text-sm text-yellow-800">
            <strong>Note:</strong> Operations for this action must be configured via the API or backend.
            This UI currently only supports managing basic action metadata.
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            {{ editingKey ? 'Save Changes' : 'Create Action' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useClassifiersStore } from '@/stores'
import type { StageAction } from '@/types/api'

const route = useRoute()
const classifiersStore = useClassifiersStore()

const props = defineProps<{
  action: StageAction | null
  editingKey: string | null
}>()

const projectClassifiers = computed(() => {
  const projectId = route.params.projectId as string
  return classifiersStore.items.filter(c => c.projectId === projectId)
})

const emit = defineEmits<{
  close: []
  save: [data: { key: string; action: StageAction }]
}>()

const form = ref({
  key: '',
  name: '',
  condition: '',
  triggerOnUserInput: true,
  triggerOnClientCommand: false,
  classificationTrigger: '',
  overrideClassifierId: '',
  template: '',
  examples: ''
})

// Initialize form when action prop changes
watch(() => props.action, (action) => {
  if (action && props.editingKey) {
    form.value = {
      key: props.editingKey,
      name: action.name,
      condition: action.condition || '',
      triggerOnUserInput: action.triggerOnUserInput,
      triggerOnClientCommand: action.triggerOnClientCommand,
      classificationTrigger: action.classificationTrigger || '',
      overrideClassifierId: action.overrideClassifierId || '',
      template: action.template || '',
      examples: action.examples?.join('\n') || ''
    }
  } else {
    // Reset form for new action
    form.value = {
      key: '',
      name: '',
      condition: '',
      triggerOnUserInput: true,
      triggerOnClientCommand: false,
      classificationTrigger: '',
      overrideClassifierId: '',
      template: '',
      examples: ''
    }
  }
}, { immediate: true })

function handleSubmit() {
  if (!form.value.key || !form.value.name) {
    return
  }

  const action: StageAction = {
    name: form.value.name,
    condition: form.value.condition || null,
    triggerOnUserInput: form.value.triggerOnUserInput,
    triggerOnClientCommand: form.value.triggerOnClientCommand,
    classificationTrigger: form.value.classificationTrigger || null,
    overrideClassifierId: form.value.overrideClassifierId || null,
    operations: props.action?.operations || [],
    template: form.value.template || null,
    examples: form.value.examples ? form.value.examples.split('\n').filter(e => e.trim()) : null,
    metadata: props.action?.metadata || null
  }

  emit('save', { key: form.value.key, action })
}
</script>

<style scoped>
.max-w-3xl {
  max-width: 48rem;
}
</style>
