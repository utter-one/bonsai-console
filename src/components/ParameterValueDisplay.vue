<template>
  <div class="parameter-value-display">
    <!-- String, Number, Boolean -->
    <span v-if="isSimpleType" class="text-gray-900 dark:text-gray-200">
      {{ String(value) }}
    </span>

    <!-- Image Parameter -->
    <div v-else-if="isImageParameter" class="mt-2">
      <img
        :src="`data:${value.mimeType};base64,${value.data}`"
        :alt="paramName"
        class="max-w-sm rounded border border-gray-300 dark:border-gray-600"
      />
      <p v-if="value.metadata" class="text-xs text-gray-500 mt-1">
        {{ value.metadata.width }}×{{ value.metadata.height }}px
      </p>
    </div>

    <!-- Audio Parameter -->
    <div v-else-if="isAudioParameter" class="mt-2">
      <audio
        controls
        :src="`data:${value.mimeType};base64,${value.data}`"
        class="w-full max-w-md"
      >
        Your browser does not support the audio element.
      </audio>
      <p class="text-xs text-gray-500 mt-1">
        Format: {{ value.format }}
      </p>
    </div>

    <!-- Array of Images -->
    <div v-else-if="isImageArray" class="mt-2 space-y-3">
      <div v-for="(img, idx) in value" :key="idx" class="border-l-2 border-gray-300 pl-3 dark:border-gray-600">
        <p class="text-xs text-gray-600 mb-1 dark:text-gray-400">Item {{ Number(idx) + 1 }}</p>
        <img
          :src="`data:${img.mimeType};base64,${img.data}`"
          :alt="`${paramName} ${Number(idx) + 1}`"
          class="max-w-xs rounded border border-gray-300 dark:border-gray-600"
        />
        <p v-if="img.metadata" class="text-xs text-gray-500 mt-1">
          {{ img.metadata.width }}×{{ img.metadata.height }}px
        </p>
      </div>
    </div>

    <!-- Array of Audio -->
    <div v-else-if="isAudioArray" class="mt-2 space-y-3">
      <div v-for="(audio, idx) in value" :key="idx" class="border-l-2 border-gray-300 pl-3 dark:border-gray-600">
        <p class="text-xs text-gray-600 mb-1 dark:text-gray-400">Item {{ Number(idx) + 1 }}</p>
        <audio
          controls
          :src="`data:${audio.mimeType};base64,${audio.data}`"
          class="w-full max-w-md"
        >
          Your browser does not support the audio element.
        </audio>
        <p class="text-xs text-gray-500 mt-1">
          Format: {{ audio.format }}
        </p>
      </div>
    </div>

    <!-- Object or other complex types -->
    <pre v-else class="text-gray-900 font-mono text-xs whitespace-pre-wrap break-words dark:text-gray-200">{{ JSON.stringify(value, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: any
  paramName?: string
}

const props = withDefaults(defineProps<Props>(), {
  paramName: 'parameter'
})

const isSimpleType = computed(() => {
  return typeof props.value === 'string' || 
         typeof props.value === 'number' || 
         typeof props.value === 'boolean'
})

const isImageParameter = computed(() => {
  return props.value && 
         typeof props.value === 'object' && 
         'data' in props.value && 
         'mimeType' in props.value && 
         props.value.mimeType?.startsWith('image/')
})

const isAudioParameter = computed(() => {
  return props.value && 
         typeof props.value === 'object' && 
         'data' in props.value && 
         'format' in props.value &&
         'mimeType' in props.value &&
         (props.value.mimeType?.startsWith('audio/') || ['pcm', 'mp3', 'wav', 'opus'].includes(props.value.format))
})

const isImageArray = computed(() => {
  if (!Array.isArray(props.value) || props.value.length === 0) return false
  return props.value.every(item => 
    item && 
    typeof item === 'object' && 
    'data' in item && 
    'mimeType' in item && 
    item.mimeType?.startsWith('image/')
  )
})

const isAudioArray = computed(() => {
  if (!Array.isArray(props.value) || props.value.length === 0) return false
  return props.value.every(item => 
    item && 
    typeof item === 'object' && 
    'data' in item && 
    'format' in item &&
    'mimeType' in item &&
    (item.mimeType?.startsWith('audio/') || ['pcm', 'mp3', 'wav', 'opus'].includes(item.format))
  )
})
</script>

<style scoped>
.parameter-value-display {
  word-break: break-word;
}
</style>
