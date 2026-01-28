<template>
  <div v-if="persona" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-header">Edit Persona</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">
            Name <span class="required">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            Prompt <span class="required">*</span>
          </label>
          <textarea
            v-model="form.prompt"
            required
            rows="6"
            class="form-textarea"
            placeholder="Enter the system prompt for this persona..."
          ></textarea>
          <p class="form-help-text">The system prompt that defines this persona's behavior</p>
        </div>

        <div class="form-group">
          <label class="form-label">Voice Provider ID</label>
          <input
            v-model="form.voiceProviderId"
            type="text"
            class="form-input-mono"
            placeholder="optional-voice-provider-id"
          />
        </div>

        <div class="card-info">
          <div class="flex-between">
            <span>Version: {{ persona.version }}</span>
            <span>Created: {{ formatDate(persona.createdAt) }}</span>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PersonaResponse } from '@/types/api'

const props = defineProps<{
  persona: PersonaResponse | null
}>()

const emit = defineEmits<{
  close: []
  update: [data: { name: string; prompt: string; voiceProviderId?: string; metadata: any }]
}>()

const form = ref({
  name: '',
  prompt: '',
  voiceProviderId: '',
  metadata: {}
})

// Initialize form when persona prop changes
watch(() => props.persona, (persona) => {
  if (persona) {
    form.value = {
      name: persona.name,
      prompt: persona.prompt,
      voiceProviderId: persona.voiceConfig?.voiceProviderId || '',
      metadata: persona.metadata || {}
    }
  }
}, { immediate: true })

const formatDate = (date: string | null) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

const handleSubmit = () => {
  const updateData: any = {
    name: form.value.name,
    prompt: form.value.prompt,
    metadata: form.value.metadata
  }
  
  // Only include voiceProviderId if it's not empty
  if (form.value.voiceProviderId) {
    updateData.voiceProviderId = form.value.voiceProviderId
  }
  
  emit('update', updateData)
}
</script>

<style scoped>
/* Modal styles are inherited from parent styles or can be added here if needed */
</style>
