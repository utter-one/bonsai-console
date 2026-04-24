<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Copy, Check } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import apiClient from '@/api/client'

const props = defineProps<{
  secretRef: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const secretValue = ref<string | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const copied = ref(false)

const parts = props.secretRef.split(':')
const secretId = parts[parts.length - 1] ?? ''

async function loadSecret() {
  isLoading.value = true
  error.value = null
  try {
    const response = await apiClient.secretsValueList(secretId)
    secretValue.value = (response as any).value
  } catch {
    error.value = 'Failed to reveal secret. You may not have sufficient permissions.'
  } finally {
    isLoading.value = false
  }
}

async function copyToClipboard() {
  if (!secretValue.value) return
  await navigator.clipboard.writeText(secretValue.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

onMounted(() => loadSecret())
</script>

<template>
  <BaseModal title="Reveal Secret" size="sm" @close="emit('close')">
    <div class="mt-4 space-y-4">
      <div>
        <div class="form-label">Secret Reference</div>
        <p class="font-mono text-sm text-gray-600 dark:text-gray-400 break-all">{{ secretRef }}</p>
      </div>
      <div>
        <div class="form-label">Decrypted Value</div>
        <div v-if="isLoading" class="text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </div>
        <div v-else class="flex gap-2 items-center">
          <input
            :value="secretValue ?? ''"
            type="text"
            readonly
            class="form-input-mono flex-1 min-w-0"
          />
          <button
            type="button"
            @click="copyToClipboard"
            class="btn-icon shrink-0"
            :title="copied ? 'Copied!' : 'Copy to clipboard'"
          >
            <Check v-if="copied" :size="16" class="text-green-500" />
            <Copy v-else :size="16" />
          </button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
