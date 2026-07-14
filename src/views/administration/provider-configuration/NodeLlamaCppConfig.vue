<script setup lang="ts">
import type { ProviderConfig } from './providerPresets'
import type { ParsedError } from '@/api/types'
import FormField from '@/components/FormField.vue'

defineProps<{ error?: ParsedError | null }>()
const config = defineModel<ProviderConfig>('config', { required: true })
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">node-llama-cpp Configuration</h3>

    <FormField label="Model Path" required :error="error" path="modelPath" class="w-full">
      <input
        v-model="config.modelPath"
        type="text"
        class="form-input"
        placeholder="e.g., /models/llama-3.2-1b-instruct.Q4_K_M.gguf"
      />
      <p class="form-help-text">
        Path to the GGUF model file on the server
      </p>
    </FormField>

    <FormField label="Context Size" class="w-full">
      <input
        v-model.number="config.contextSize"
        type="number"
        min="1"
        class="form-input"
        placeholder="e.g., 4096"
      />
      <p class="form-help-text">
        Context window size in tokens
      </p>
    </FormField>

    <FormField label="GPU Layers" class="w-full">
      <input
        v-model.number="config.gpuLayers"
        type="number"
        min="0"
        class="form-input"
        placeholder="e.g., 33"
      />
      <p class="form-help-text">
        Number of layers to offload to GPU (0 = CPU only)
      </p>
    </FormField>

    <FormField label="Threads" class="w-full">
      <input
        v-model.number="config.threads"
        type="number"
        min="1"
        class="form-input"
        placeholder="e.g., 8"
      />
      <p class="form-help-text">
        Number of CPU threads for inference
      </p>
    </FormField>

    <FormField label="Batch Size" class="w-full">
      <input
        v-model.number="config.batchSize"
        type="number"
        min="1"
        class="form-input"
        placeholder="e.g., 2048"
      />
      <p class="form-help-text">
        Batch size for token processing
      </p>
    </FormField>

    <FormField label="Flash Attention" class="w-full">
      <label class="flex items-center cursor-pointer">
        <input
          v-model="config.flashAttention"
          type="checkbox"
          class="form-checkbox mr-2"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">Enable flash attention optimization</span>
      </label>
    </FormField>
  </div>
</template>
