<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, useAttrs, useSlots } from 'vue'
import type { ParsedError, ApiErrorDetail } from '@/api/types'
import { FORM_GROUP_KEY, type FormGroupPath } from './formGroup'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

type SinglePath = string | number | (string | number)[]

const props = defineProps<{
  label?: string
  error?: ParsedError | null
  path?: SinglePath
  required?: boolean
  hint?: string
  help?: string
}>()

defineSlots<{
  default(props: { fieldError: ApiErrorDetail | null; getPathError: (p: SinglePath) => ApiErrorDetail | null }): unknown
  leading(): unknown
}>()

const slots = useSlots()
const hasLeadingSlot = computed(() => !!slots.leading)

const ctx = inject(FORM_GROUP_KEY, null)
const isChild = computed(() => ctx !== null)

onMounted(() => {
  if (ctx && props.path !== undefined) ctx.registerPath(props.path as FormGroupPath)
})

onBeforeUnmount(() => {
  if (ctx && props.path !== undefined) ctx.unregisterPath(props.path as FormGroupPath)
})

function resolveError(path: SinglePath): ApiErrorDetail | null {
  if (ctx) return ctx.resolveError(path as FormGroupPath)
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

const fieldError = computed<ApiErrorDetail | null>(() => {
  if (props.path !== undefined) return resolveError(props.path)
  else if(props.error) return { message: props.error.message, path: [] as string[] } as ApiErrorDetail
  return null
})

const hasWidthClass = computed(() =>
  typeof attrs.class === 'string' && /\bw-/.test(attrs.class)
)

const dataFieldPaths = computed(() => {
  if (props.path !== undefined) {
    return String(Array.isArray(props.path) ? props.path[0] : props.path)
  }
  return undefined
})
</script>

<template>
  <!-- Child mode: inside CompositeFormField -->
  <div
    v-if="isChild"
    :data-field-paths="dataFieldPaths"
    :class="[attrs.class, { 'ring-1 ring-red-500 dark:ring-red-400 rounded-md': fieldError }]"
  >
    <slot :field-error="fieldError" :get-path-error="resolveError" />
  </div>

  <!-- Standalone mode -->
  <div v-else class="form-group" :data-field-paths="dataFieldPaths">
    <div :class="{ 'ring-1 ring-red-500 dark:ring-red-400 rounded-md': fieldError && hasLeadingSlot }">
      <label v-if="label" class="form-label">
        <slot name="leading" />
        {{ label }}
        <span v-if="hint" class="text-gray-500 font-normal">{{ hint }}</span>
        <span v-else-if="required" class="required">*</span>
        <span v-else class="text-gray-500 font-normal">(optional)</span>
      </label>
      <div
        :class="[attrs.class, { 'w-fit': !hasWidthClass, 'ring-1 ring-red-500 dark:ring-red-400 rounded-md': fieldError && !hasLeadingSlot }]"
      >
        <slot :field-error="fieldError" :get-path-error="resolveError" />
      </div>
    </div>
    <p v-if="fieldError" class="form-field-error">{{ fieldError.message }}</p>
    <p v-else-if="help" class="form-help-text">{{ help }}</p>
  </div>
</template>
