<template>
  <div class="variable-node">
    <!-- Root level (no container) -->
    <template v-if="isRoot">
      <div v-if="isObject(data)" class="space-y-2">
        <div v-for="[key, value] in Object.entries(data)" :key="key" class="variable-entry">
          <VariableNode :data="value" :path="[...path, key]" :property-name="key" />
        </div>
      </div>
      <div v-else-if="Array.isArray(data)" class="space-y-2">
        <div v-for="(item, index) in data" :key="index" class="variable-entry">
          <VariableNode :data="item" :path="[...path, String(index)]" :property-name="String(index)" />
        </div>
      </div>
      <div v-else class="text-sm text-gray-700 dark:text-gray-300">
        <span class="font-mono">{{ formatValue(data) }}</span>
      </div>
    </template>

    <!-- Non-root nodes -->
    <template v-else>
      <!-- Image data (check before generic object) -->
      <template v-if="isImageData(data)">
        <div class="flex items-start gap-2">
          <div class="w-5 flex-shrink-0"></div>
          <div class="flex-1 min-w-0 space-y-2">
            <div class="font-semibold text-gray-900 dark:text-white">{{ propertyName }}</div>
            <img 
              :src="getMediaDataUrl(data)" 
              :alt="propertyName"
              class="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              style="max-height: 400px;"
              @error="handleImageError"
            />
            <div v-if="data.metadata" class="text-xs text-gray-500 font-mono">
              {{ data.metadata.width }} × {{ data.metadata.height }}
            </div>
          </div>
        </div>
      </template>

      <!-- Audio data (check before generic object) -->
      <template v-else-if="isAudioData(data)">
        <div class="flex items-start gap-2">
          <div class="w-5 flex-shrink-0"></div>
          <div class="flex-1 min-w-0 space-y-2">
            <div class="font-semibold text-gray-900 dark:text-white">{{ propertyName }}</div>
            <audio 
              controls 
              :src="getMediaDataUrl(data)"
              class="w-full max-w-md"
              preload="metadata"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      </template>

      <!-- Object or Array with expandable content -->
      <template v-else-if="isObject(data) || Array.isArray(data)">
        <div class="flex items-start gap-2">
          <button
            @click="isExpanded = !isExpanded"
            class="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-transform"
            :class="{ 'rotate-90': isExpanded }"
            :title="isExpanded ? 'Collapse' : 'Expand'">
            <ChevronRight :size="16" />
          </button>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-900 dark:text-white">{{ propertyName }}</span>
              <span class="text-xs text-gray-500 font-mono">
                {{ Array.isArray(data) ? `Array(${data.length})` : `Object(${Object.keys(data).length})` }}
              </span>
            </div>
            <div v-if="isExpanded" class="mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600 space-y-2">
              <template v-if="isObject(data)">
                <div v-for="[key, value] in Object.entries(data)" :key="key">
                  <VariableNode :data="value" :path="[...path, key]" :property-name="key" />
                </div>
              </template>
              <template v-else-if="Array.isArray(data)">
                <div v-for="(item, index) in data" :key="index">
                  <VariableNode :data="item" :path="[...path, String(index)]" :property-name="`[${index}]`" />
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>

      <!-- Primitive values -->
      <template v-else>
        <div class="flex items-start gap-2">
          <div class="w-5 flex-shrink-0"></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="font-semibold text-gray-900 dark:text-white">{{ propertyName }}:</span>
              <span class="font-mono text-sm break-all" :class="getValueClass(data)">
                {{ formatValue(data) }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  data: any
  path: string[]
  propertyName?: string
  isRoot?: boolean
}>()

const isExpanded = ref(false)

function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function formatValue(value: any): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return String(value)
  return String(value)
}

function getValueClass(value: any): string {
  if (value === null || value === undefined) {
    return 'text-gray-400 dark:text-gray-500 italic'
  }
  if (typeof value === 'string') {
    return 'text-green-700 dark:text-green-400'
  }
  if (typeof value === 'number') {
    return 'text-blue-700 dark:text-blue-400'
  }
  if (typeof value === 'boolean') {
    return 'text-purple-700 dark:text-purple-400'
  }
  return 'text-gray-700 dark:text-gray-300'
}

/**
 * Check if value is image data (object with data and mimeType fields)
 */
function isImageData(value: any): boolean {
  if (typeof value !== 'object' || value === null) return false
  
  // Check for object with data and mimeType fields
  if ('data' in value && 'mimeType' in value && typeof value.mimeType === 'string') {
    return value.mimeType.startsWith('image/')
  }
  
  return false
}

/**
 * Check if value is audio data (object with data and mimeType fields)
 */
function isAudioData(value: any): boolean {
  if (typeof value !== 'object' || value === null) return false
  
  // Check for object with data and mimeType fields
  if ('data' in value && 'mimeType' in value && typeof value.mimeType === 'string') {
    return value.mimeType.startsWith('audio/')
  }
  
  return false
}

/**
 * Convert media object (with data and mimeType) to data URL
 */
function getMediaDataUrl(value: any): string {
  if (typeof value !== 'object' || !value.data || !value.mimeType) {
    return ''
  }
  return `data:${value.mimeType};base64,${value.data}`
}

/**
 * Handle image loading errors
 */
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  console.error('Failed to load image:', img.src)
}
</script>


