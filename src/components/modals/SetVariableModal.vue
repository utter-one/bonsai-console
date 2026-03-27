<template>
  <BaseModal title="Set Variable" size="3xl" @close="$emit('close')">

      <!-- Current stage info -->
      <div v-if="currentStage" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800">
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <span class="font-semibold">Current Stage:</span> {{ currentStage.name }}
        </p>
      </div>

      <!-- Empty state: No stage -->
      <div v-if="!currentStage" class="py-12 text-center text-gray-500 dark:text-gray-400">
        <p>No active stage. Please start a conversation first.</p>
        <div class="modal-footer mt-8">
          <button type="button" @click="$emit('close')" class="btn-secondary">Close</button>
        </div>
      </div>

      <!-- Empty state: No variables defined -->
      <div v-else-if="availableVariables.length === 0">
        <div class="py-12 text-center text-gray-500 dark:text-gray-400">
          <p>This stage has no variable descriptors defined.</p>
        </div>
        <div class="modal-footer mt-8">
          <button type="button" @click="$emit('close')" class="btn-secondary">Close</button>
        </div>
      </div>

      <!-- Variable selection and value input -->
      <form v-else @submit.prevent="handleSubmit">
        <!-- Variable Selection -->
        <div class="form-group">
          <label class="form-label">
            Variable <span class="text-red-500">*</span>
          </label>
          <select v-model="selectedVariableName" class="form-select" required @change="onVariableChange">
            <option value="">Select a variable...</option>
            <option v-for="variable in availableVariables" :key="variable.name" :value="variable.name">
              {{ variable.name }} ({{ variable.type }})
            </option>
          </select>
        </div>

        <!-- Value Input (shown when variable is selected) -->
        <div v-if="selectedVariable" class="border-t border-gray-200 pt-4 mt-4 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-200">Value</h3>

          <!-- String input -->
          <div v-if="selectedVariable.type === 'string'" class="form-group">
            <input
              v-model="variableValue"
              type="text"
              class="form-input"
              placeholder="Enter string value..."
            />
          </div>

          <!-- Number input -->
          <div v-else-if="selectedVariable.type === 'number'" class="form-group">
            <input
              v-model.number="variableValue"
              type="number"
              step="any"
              class="form-input"
              placeholder="Enter number value..."
            />
          </div>

          <!-- Boolean input -->
          <div v-else-if="selectedVariable.type === 'boolean'" class="form-group">
            <div class="flex items-center gap-2">
              <input
                v-model="variableValue"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="text-sm text-gray-700 dark:text-gray-200">
                {{ variableValue ? 'True' : 'False' }}
              </span>
            </div>
          </div>

          <!-- Object input (JSON) -->
          <div v-else-if="selectedVariable.type === 'object'" class="form-group">
            <textarea
              v-model="variableValueText"
              class="form-textarea font-mono text-sm"
              rows="6"
              placeholder="Enter JSON object..."
            />
            <p class="text-xs text-gray-500 mt-1">Enter a valid JSON object</p>
            <p v-if="jsonError" class="text-xs text-red-600 mt-1">{{ jsonError }}</p>
          </div>

          <!-- String array input -->
          <div v-else-if="selectedVariable.type === 'string[]'" class="form-group space-y-2">
            <div v-for="(_item, index) in arrayValue" :key="index" class="flex gap-2">
              <input
                v-model="arrayValue[index]"
                type="text"
                class="form-input flex-1"
                placeholder="Enter string..."
              />
              <button
                type="button"
                @click="removeArrayItem(index)"
                class="btn-danger px-3 py-2"
                title="Remove item"
              >
                <X :size="16" />
              </button>
            </div>
            <button
              type="button"
              @click="addArrayItem('string')"
              class="btn-secondary text-sm"
            >
              <Plus :size="16" />
              Add Item
            </button>
          </div>

          <!-- Number array input -->
          <div v-else-if="selectedVariable.type === 'number[]'" class="form-group space-y-2">
            <div v-for="(_item, index) in arrayValue" :key="index" class="flex gap-2">
              <input
                v-model.number="arrayValue[index]"
                type="number"
                step="any"
                class="form-input flex-1"
                placeholder="Enter number..."
              />
              <button
                type="button"
                @click="removeArrayItem(index)"
                class="btn-danger px-3 py-2"
                title="Remove item"
              >
                <X :size="16" />
              </button>
            </div>
            <button
              type="button"
              @click="addArrayItem('number')"
              class="btn-secondary text-sm"
            >
              <Plus :size="16" />
              Add Item
            </button>
          </div>

          <!-- Boolean array input -->
          <div v-else-if="selectedVariable.type === 'boolean[]'" class="form-group space-y-2">
            <div v-for="(_item, index) in arrayValue" :key="index" class="flex gap-2 items-center">
              <div class="flex items-center gap-2 flex-1">
                <input
                  v-model="arrayValue[index]"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="text-sm text-gray-700 dark:text-gray-200">
                  {{ arrayValue[index] ? 'True' : 'False' }}
                </span>
              </div>
              <button
                type="button"
                @click="removeArrayItem(index)"
                class="btn-danger px-3 py-2"
                title="Remove item"
              >
                <X :size="16" />
              </button>
            </div>
            <button
              type="button"
              @click="addArrayItem('boolean')"
              class="btn-secondary text-sm"
            >
              <Plus :size="16" />
              Add Item
            </button>
          </div>

          <!-- Object array input (JSON objects) -->
          <div v-else-if="selectedVariable.type === 'object[]'" class="form-group space-y-2">
            <div v-for="(_item, index) in arrayValue" :key="index" class="space-y-1">
              <div class="flex gap-2">
                <textarea
                  v-model="arrayValue[index]"
                  class="form-textarea font-mono text-sm flex-1"
                  rows="3"
                  placeholder="Enter JSON object..."
                />
                <button
                  type="button"
                  @click="removeArrayItem(index)"
                  class="btn-danger px-3 py-2 h-fit"
                  title="Remove item"
                >
                  <X :size="16" />
                </button>
              </div>
            </div>
            <button
              type="button"
              @click="addArrayItem('object')"
              class="btn-secondary text-sm"
            >
              <Plus :size="16" />
              Add Item
            </button>
            <p class="text-xs text-gray-500">Enter one JSON object per item</p>
            <p v-if="jsonError" class="text-xs text-red-600">{{ jsonError }}</p>
          </div>

          <!-- Image input -->
          <div v-else-if="selectedVariable.type === 'image'" class="form-group space-y-2">
            <input
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="form-input"
            />
            <div v-if="variableValue" class="mt-2 p-2 bg-gray-50 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <img :src="getImagePreview()" alt="Preview" class="max-w-xs max-h-48 rounded" />
              <p class="text-xs text-gray-600 mt-2 dark:text-gray-400">
                {{ variableValue.mimeType }} - {{ variableValue.metadata?.width }} × {{ variableValue.metadata?.height }}px
              </p>
            </div>
          </div>

          <!-- Image array input -->
          <div v-else-if="selectedVariable.type === 'image[]'" class="form-group space-y-3">
            <div v-for="(item, index) in arrayValue" :key="index" class="border border-gray-200 rounded-md p-3 dark:border-gray-700">
              <div class="flex gap-2 items-start">
                <div class="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    @change="handleImageArrayUpload($event, index)"
                    class="form-input"
                  />
                  <div v-if="item" class="mt-2 p-2 bg-gray-50 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <img :src="getImageArrayPreview(index)" alt="Preview" class="max-w-xs max-h-32 rounded" />
                    <p class="text-xs text-gray-600 mt-1 dark:text-gray-400">
                      {{ item.mimeType }} - {{ item.metadata?.width }} × {{ item.metadata?.height }}px
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="removeArrayItem(index)"
                  class="btn-danger px-3 py-2"
                  title="Remove item"
                >
                  <X :size="16" />
                </button>
              </div>
            </div>
            <button
              type="button"
              @click="addArrayItem('image')"
              class="btn-secondary text-sm"
            >
              <Plus :size="16" />
              Add Image
            </button>
          </div>

          <!-- Audio input -->
          <div v-else-if="selectedVariable.type === 'audio'" class="form-group space-y-2">
            <input
              type="file"
              accept="audio/*"
              @change="handleAudioUpload"
              class="form-input"
            />
            <div v-if="variableValue" class="mt-2 p-2 bg-gray-50 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                <strong>Format:</strong> {{ variableValue.format }}
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                {{ variableValue.mimeType }}
              </p>
            </div>
          </div>

          <!-- Audio array input -->
          <div v-else-if="selectedVariable.type === 'audio[]'" class="form-group space-y-3">
            <div v-for="(item, index) in arrayValue" :key="index" class="border border-gray-200 rounded-md p-3 dark:border-gray-700">
              <div class="flex gap-2 items-start">
                <div class="flex-1">
                  <input
                    type="file"
                    accept="audio/*"
                    @change="handleAudioArrayUpload($event, index)"
                    class="form-input"
                  />
                  <div v-if="item" class="mt-2 p-2 bg-gray-50 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <p class="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Format:</strong> {{ item.format }}
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      {{ item.mimeType }}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="removeArrayItem(index)"
                  class="btn-danger px-3 py-2"
                  title="Remove item"
                >
                  <X :size="16" />
                </button>
              </div>
            </div>
            <button
              type="button"
              @click="addArrayItem('audio')"
              class="btn-secondary text-sm"
            >
              <Plus :size="16" />
              Add Audio
            </button>
          </div>
        </div>

        <!-- Error display -->
        <div v-if="errorMessage" class="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm mt-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
          {{ errorMessage }}
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="!selectedVariableName || isSubmitting"
          >
            {{ isSubmitting ? 'Setting...' : 'Set Variable' }}
          </button>
        </div>
      </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Plus } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import type { StageResponse } from '@/api/types'

const props = defineProps<{
  currentStage: StageResponse | null
}>()

const emit = defineEmits<{
  close: []
  set: [data: { variableName: string; variableValue: any }]
}>()

const selectedVariableName = ref('')
const variableValue = ref<any>(null)
const variableValueText = ref('')
const arrayValue = ref<any[]>([])
const errorMessage = ref('')
const jsonError = ref('')
const isSubmitting = ref(false)

const availableVariables = computed(() => {
  if (!props.currentStage?.variableDescriptors) return []
  return props.currentStage.variableDescriptors
})

const selectedVariable = computed(() => {
  if (!selectedVariableName.value) return null
  return availableVariables.value.find(v => v.name === selectedVariableName.value) || null
})

function onVariableChange() {
  // Reset values when variable changes
  errorMessage.value = ''
  jsonError.value = ''
  
  if (!selectedVariable.value) {
    variableValue.value = null
    variableValueText.value = ''
    arrayValue.value = []
    return
  }

  const type = selectedVariable.value.type

  // Initialize with appropriate default value based on type
  if (type === 'string') {
    variableValue.value = ''
  } else if (type === 'number') {
    variableValue.value = 0
  } else if (type === 'boolean') {
    variableValue.value = false
  } else if (type === 'object') {
    variableValueText.value = '{}'
    variableValue.value = {}
  } else if (type === 'string[]') {
    arrayValue.value = ['']
  } else if (type === 'number[]') {
    arrayValue.value = [0]
  } else if (type === 'boolean[]') {
    arrayValue.value = [false]
  } else if (type === 'object[]') {
    arrayValue.value = ['{}']
  } else if (type === 'image[]') {
    arrayValue.value = []
  } else if (type === 'audio[]') {
    arrayValue.value = []
  } else if (type === 'image') {
    variableValue.value = null
  } else if (type === 'audio') {
    variableValue.value = null
  }
}

function addArrayItem(itemType: string) {
  if (itemType === 'string') {
    arrayValue.value.push('')
  } else if (itemType === 'number') {
    arrayValue.value.push(0)
  } else if (itemType === 'boolean') {
    arrayValue.value.push(false)
  } else if (itemType === 'object') {
    arrayValue.value.push('{}')
  } else if (itemType === 'image' || itemType === 'audio') {
    arrayValue.value.push(null)
  }
}

function removeArrayItem(index: number) {
  arrayValue.value.splice(index, 1)
}

function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (!dataUrl) return
    
    const parts = dataUrl.split(',')
    if (parts.length !== 2) return
    
    const header = parts[0]!
    const base64Data = parts[1]!
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png'

    // Create image to get dimensions
    const img = new Image()
    img.onload = () => {
      variableValue.value = {
        data: base64Data,
        mimeType,
        metadata: {
          width: img.width,
          height: img.height
        }
      }
    }
    img.src = dataUrl
  }
  reader.readAsDataURL(file)
}

function handleImageArrayUpload(event: Event, index: number) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (!dataUrl) return
    
    const parts = dataUrl.split(',')
    if (parts.length !== 2) return
    
    const header = parts[0]!
    const base64Data = parts[1]!
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png'

    const img = new Image()
    img.onload = () => {
      arrayValue.value[index] = {
        data: base64Data,
        mimeType,
        metadata: {
          width: img.width,
          height: img.height
        }
      }
    }
    img.src = dataUrl
  }
  reader.readAsDataURL(file)
}

function handleAudioUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (!dataUrl) return
    
    const parts = dataUrl.split(',')
    if (parts.length !== 2) return
    
    const header = parts[0]!
    const base64Data = parts[1]!
    const mimeType = header.match(/:(.*?);/)?.[1] || 'audio/mpeg'

    // Determine format from MIME type
    let format: 'pcm' | 'mp3' | 'wav' | 'opus' = 'mp3'
    if (mimeType.includes('wav')) format = 'wav'
    else if (mimeType.includes('opus')) format = 'opus'
    else if (mimeType.includes('pcm')) format = 'pcm'

    variableValue.value = {
      data: base64Data,
      format,
      mimeType,
      metadata: {}
    }
  }
  reader.readAsDataURL(file)
}

function handleAudioArrayUpload(event: Event, index: number) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (!dataUrl) return
    
    const parts = dataUrl.split(',')
    if (parts.length !== 2) return
    
    const header = parts[0]!
    const base64Data = parts[1]!
    const mimeType = header.match(/:(.*?);/)?.[1] || 'audio/mpeg'

    let format: 'pcm' | 'mp3' | 'wav' | 'opus' = 'mp3'
    if (mimeType.includes('wav')) format = 'wav'
    else if (mimeType.includes('opus')) format = 'opus'
    else if (mimeType.includes('pcm')) format = 'pcm'

    arrayValue.value[index] = {
      data: base64Data,
      format,
      mimeType,
      metadata: {}
    }
  }
  reader.readAsDataURL(file)
}

function getImagePreview(): string {
  if (!variableValue.value?.data) return ''
  return `data:${variableValue.value.mimeType};base64,${variableValue.value.data}`
}

function getImageArrayPreview(index: number): string {
  const item = arrayValue.value[index]
  if (!item?.data) return ''
  return `data:${item.mimeType};base64,${item.data}`
}

function handleSubmit() {
  if (!selectedVariable.value) return

  errorMessage.value = ''
  jsonError.value = ''

  try {
    let finalValue: any

    const type = selectedVariable.value.type

    if (type === 'string' || type === 'number' || type === 'boolean' || type === 'image' || type === 'audio') {
      finalValue = variableValue.value
    } else if (type === 'object') {
      // Parse JSON for object
      try {
        finalValue = JSON.parse(variableValueText.value)
      } catch (e) {
        jsonError.value = 'Invalid JSON format'
        return
      }
    } else if (type === 'string[]' || type === 'number[]' || type === 'boolean[]' || type === 'image[]' || type === 'audio[]') {
      finalValue = arrayValue.value
    } else if (type === 'object[]') {
      // Parse each JSON object in the array
      try {
        finalValue = arrayValue.value.map(item => JSON.parse(item))
      } catch (e) {
        jsonError.value = 'One or more items contain invalid JSON'
        return
      }
    }

    isSubmitting.value = true
    emit('set', {
      variableName: selectedVariableName.value,
      variableValue: finalValue
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'An error occurred'
    isSubmitting.value = false
  }
}
</script>
