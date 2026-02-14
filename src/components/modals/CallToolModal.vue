<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content max-w-2xl" @click.stop>
      <h2 class="modal-header">Call Tool</h2>
      
      <div class="mb-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Select a tool and provide its parameters</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-gray-500 dark:text-gray-400">Loading tools...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="py-6 text-center text-red-600 dark:text-red-400">
        <p>Error loading tools: {{ error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="availableTools.length === 0" class="py-12 text-center text-gray-500 dark:text-gray-400">
        <p>No tools found for this project</p>
      </div>

      <!-- Tool Selection and Parameters -->
      <div v-else class="space-y-6 mb-6">
        <!-- Tool Dropdown -->
        <div class="form-group">
          <label class="form-label">Tool <span class="required">*</span></label>
          <select 
            v-model="selectedToolId" 
            class="form-select-auto"
            required
            @change="onToolChange"
          >
            <option :value="null">Select a tool...</option>
            <option v-for="tool in availableTools" :key="tool.id" :value="tool.id">
              {{ tool.name }}
            </option>
          </select>
          <p v-if="selectedTool?.description" class="text-sm text-gray-600 mt-2 dark:text-gray-400">
            {{ selectedTool.description }}
          </p>
        </div>

        <!-- Parameters Section -->
        <div v-if="selectedTool && selectedTool.parameters.length > 0" class="space-y-4">
          <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">Tool Parameters</h3>
            
            <div 
              v-for="param in selectedTool.parameters" 
              :key="param.name"
              class="form-group"
            >
              <label class="form-label text-sm">
                {{ param.name }}
                <span v-if="param.required" class="required">*</span>
                <span v-else class="text-gray-500 text-xs ml-1">(optional)</span>
              </label>
              
              <!-- String input -->
              <input 
                v-if="param.type === 'string'"
                v-model="parameterValues[param.name]"
                type="text"
                :required="param.required"
                :placeholder="param.description"
                class="form-input text-sm"
              />
              
              <!-- Number input -->
              <input 
                v-else-if="param.type === 'number'"
                v-model.number="parameterValues[param.name]"
                type="number"
                :required="param.required"
                :placeholder="param.description"
                class="form-input text-sm"
              />
              
              <!-- Boolean checkbox -->
              <label v-else-if="param.type === 'boolean'" class="flex items-center cursor-pointer">
                <input
                  v-model="parameterValues[param.name]"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {{ param.description }}
                </span>
              </label>
              
              <!-- Object input (JSON) -->
              <div v-else-if="param.type === 'object'" class="space-y-1">
                <textarea
                  v-model="parameterValues[param.name]"
                  :required="param.required"
                  :placeholder="param.description + ' (JSON format)'"
                  class="form-textarea text-sm font-mono"
                  rows="4"
                />
                <p class="text-xs text-gray-500">Enter a valid JSON object</p>
              </div>
              
              <!-- Array inputs (string[], number[], boolean[], object[]) -->
              <div v-else-if="param.type.endsWith('[]')" class="space-y-2">
                <div 
                  v-for="(_item, index) in getArrayValue(param.name)" 
                  :key="index"
                  class="flex gap-2"
                >
                  <input 
                    v-if="param.type === 'string[]'"
                    v-model="parameterValues[param.name][index]"
                    type="text"
                    :placeholder="`${param.description} (item ${index + 1})`"
                    class="form-input text-sm flex-1"
                  />
                  <input 
                    v-else-if="param.type === 'number[]'"
                    v-model.number="parameterValues[param.name][index]"
                    type="number"
                    :placeholder="`${param.description} (item ${index + 1})`"
                    class="form-input text-sm flex-1"
                  />
                  <label v-else-if="param.type === 'boolean[]'" class="flex items-center cursor-pointer flex-1">
                    <input
                      v-model="parameterValues[param.name][index]"
                      type="checkbox"
                      class="form-checkbox"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Item {{ index + 1 }}
                    </span>
                  </label>
                  <textarea
                    v-else-if="param.type === 'object[]'"
                    v-model="parameterValues[param.name][index]"
                    :placeholder="`${param.description} (item ${index + 1}, JSON format)`"
                    class="form-textarea text-sm font-mono flex-1"
                    rows="3"
                  />
                  <button 
                    type="button"
                    @click="removeArrayItem(param.name, index)"
                    class="btn-secondary px-3"
                  >
                    Remove
                  </button>
                </div>
                <button 
                  type="button"
                  @click="addArrayItem(param.name, param.type)"
                  class="btn-secondary text-sm w-full"
                >
                  + Add Item
                </button>
              </div>

              <p class="text-xs text-gray-500 mt-1">
                {{ param.description }} ({{ param.type }})
              </p>
            </div>
          </div>
        </div>

        <!-- No Parameters Message -->
        <div v-else-if="selectedTool && selectedTool.parameters.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-4">
          This tool doesn't require any parameters.
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3">
        <button type="button" @click="$emit('close')" class="btn-secondary">
          Cancel
        </button>
        <button 
          type="button" 
          @click="handleCallTool" 
          class="btn-primary"
          :disabled="!canCallTool"
        >
          Call Tool
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToolsStore } from '@/stores'

const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'call', toolId: string, parameters: Record<string, any>): void
}>()

const toolsStore = useToolsStore()

const selectedToolId = ref<string | null>(null)
const parameterValues = ref<Record<string, any>>({})

const isLoading = computed(() => toolsStore.isLoading)
const error = computed(() => toolsStore.error)

// Filter tools for the current project and sort alphabetically
const availableTools = computed(() => {
  return [...toolsStore.items]
    .filter(tool => tool.projectId === props.projectId)
    .sort((a, b) => a.name.localeCompare(b.name))
})

const selectedTool = computed(() => {
  if (!selectedToolId.value) return null
  return availableTools.value.find(tool => tool.id === selectedToolId.value) || null
})

const canCallTool = computed(() => {
  if (!selectedTool.value) return false
  
  // Check all required parameters are provided
  for (const param of selectedTool.value.parameters) {
    if (param.required) {
      const value = parameterValues.value[param.name]
      
      // Check if value is missing or empty
      if (value === undefined || value === null || value === '') {
        return false
      }
      
      // For arrays, check if at least one item exists
      if (param.type.endsWith('[]') && Array.isArray(value) && value.length === 0) {
        return false
      }
    }
  }
  
  return true
})

function onToolChange() {
  // Reset parameters when tool changes
  parameterValues.value = {}
  
  if (selectedTool.value) {
    // Initialize parameter values
    for (const param of selectedTool.value.parameters) {
      if (param.type === 'boolean') {
        parameterValues.value[param.name] = false
      } else if (param.type === 'object') {
        parameterValues.value[param.name] = '{}'
      } else if (param.type.endsWith('[]')) {
        parameterValues.value[param.name] = []
      } else {
        parameterValues.value[param.name] = ''
      }
    }
  }
}

function getArrayValue(paramName: string): any[] {
  if (!Array.isArray(parameterValues.value[paramName])) {
    parameterValues.value[paramName] = []
  }
  return parameterValues.value[paramName]
}

function addArrayItem(paramName: string, paramType: string) {
  if (!Array.isArray(parameterValues.value[paramName])) {
    parameterValues.value[paramName] = []
  }
  
  if (paramType === 'string[]') {
    parameterValues.value[paramName].push('')
  } else if (paramType === 'number[]') {
    parameterValues.value[paramName].push(0)
  } else if (paramType === 'boolean[]') {
    parameterValues.value[paramName].push(false)
  } else if (paramType === 'object[]') {
    parameterValues.value[paramName].push('{}')
  }
}

function removeArrayItem(paramName: string, index: number) {
  if (Array.isArray(parameterValues.value[paramName])) {
    parameterValues.value[paramName].splice(index, 1)
  }
}

function handleCallTool() {
  if (!selectedTool.value || !canCallTool.value) return
  
  // Build the parameters object with only non-empty values
  const parameters: Record<string, any> = {}
  
  try {
    for (const param of selectedTool.value.parameters) {
      const value = parameterValues.value[param.name]
      
      // Only include if value is provided
      if (value !== undefined && value !== null && value !== '') {
        // Handle object type - parse JSON
        if (param.type === 'object') {
          try {
            parameters[param.name] = JSON.parse(value)
          } catch (e) {
            alert(`Invalid JSON for parameter "${param.name}": ${e instanceof Error ? e.message : 'Parse error'}`)
            return
          }
        }
        // Handle object[] type - parse each JSON string in array
        else if (param.type === 'object[]' && Array.isArray(value)) {
          const parsedArray: any[] = []
          for (let i = 0; i < value.length; i++) {
            const item = value[i]
            if (item && item.trim()) {
              try {
                parsedArray.push(JSON.parse(item))
              } catch (e) {
                alert(`Invalid JSON for parameter "${param.name}" at item ${i + 1}: ${e instanceof Error ? e.message : 'Parse error'}`)
                return
              }
            }
          }
          if (parsedArray.length > 0) {
            parameters[param.name] = parsedArray
          }
        }
        // For other arrays, filter out empty strings if it's a string array
        else if (param.type.endsWith('[]') && Array.isArray(value)) {
          if (param.type === 'string[]') {
            const filtered = value.filter(item => item !== '')
            if (filtered.length > 0) {
              parameters[param.name] = filtered
            }
          } else {
            parameters[param.name] = value
          }
        } else {
          parameters[param.name] = value
        }
      }
    }
    
    emit('call', selectedTool.value.id, parameters)
    emit('close')
  } catch (e) {
    alert(`Error preparing parameters: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }
}

// Load tools on mount
onMounted(async () => {
  if (!toolsStore.items.length) {
    await toolsStore.fetchAll({ filters: { projectId: props.projectId } })
  }
})
</script>
