<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import type { ParsedError, ApiErrorDetail } from '@/api/types'
import { FORM_GROUP_KEY, type FormGroupPath } from './formGroup'

const props = defineProps<{
  label?: string
  error: ParsedError | null
  required?: boolean
  hint?: string
  help?: string
}>()

function resolveError(path: FormGroupPath): ApiErrorDetail | null {
  if (!props.error?.details?.length) return null
  const normalized: (string | number)[] = Array.isArray(path) ? path : [path]
  return (
    props.error.details.find(
      (d) =>
        d.path.length === normalized.length &&
        d.path.every((seg, i) => String(seg) === String(normalized[i]))
    ) ?? null
  )
}

const registeredPaths = ref<FormGroupPath[]>([])

function registerPath(path: FormGroupPath) {
  registeredPaths.value.push(path)
}

function unregisterPath(path: FormGroupPath) {
  const str = JSON.stringify(path)
  const idx = registeredPaths.value.findIndex((p) => JSON.stringify(p) === str)
  if (idx !== -1) registeredPaths.value.splice(idx, 1)
}

provide(FORM_GROUP_KEY, { resolveError, registerPath, unregisterPath })

const fieldError = computed<ApiErrorDetail | null>(() => {
  for (const path of registeredPaths.value) {
    const e = resolveError(path)
    if (e) return e
  }
  return null
})
</script>

<template>
  <div class="form-group">
    <label v-if="label" class="form-label">
      {{ label }}
      <span v-if="hint" class="text-gray-500 font-normal">{{ hint }}</span>
      <span v-else-if="required" class="required">*</span>
      <span v-else class="text-gray-500 font-normal">(optional)</span>
    </label>
    <slot />
    <p v-if="fieldError" class="form-field-error">{{ fieldError.message }}</p>
    <p v-else-if="help" class="form-help-text">{{ help }}</p>
  </div>
</template>
