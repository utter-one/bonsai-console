<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import type { ParsedError } from '@/api/types'
import { ref, watch } from 'vue';

const props = defineProps<{
  error: ParsedError | null
}>()
const dismissed = ref(false)

// Reset dismissed whenever error changes
watch(
  () => props.error,
  (newError, oldError) => {
    if (newError !== oldError) {
      dismissed.value = false
    }
  }
)

</script>

<template>
  <transition name="scale-fade">
  <div v-if="error && !dismissed" class="alert-error flex flex-col gap-2">
    <div class="flex items-start justify-between">
      <div class="flex flex-row gap-2">
        <AlertCircle class="shrink-0 mt-0.5" :size="16" />
        <span>{{ error.message }}</span>
      </div>
      <!-- Button dismissing the this component-->
      <button type="button" @click="dismissed=true" class="self-end text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
        Dismiss
      </button>
    </div>
    <ul v-if="error.details && error.details.length > 0" class="border-t border-red-200 dark:border-red-700 pt-2 mt-0.5 flex flex-col gap-1 pl-1">
      <li
        v-for="(detail, i) in error.details"
        :key="i"
        class="flex items-baseline gap-1.5 text-xs"
      >
        <span class="text-red-400 dark:text-red-500 select-none">·</span>
        <code class="font-mono text-red-700 dark:text-red-300">{{ detail.path.join('.') }}</code>
        <span class="text-red-500 dark:text-red-400">—</span>
        <span>{{ detail.message }}</span>
      </li>
    </ul>

  </div>
</transition>
</template>

<style lang="css">

.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: all 0.2s ease;
  transform-origin: top;
}

.scale-fade-enter-from {
  opacity: 0;
  transform: scaleY(0.95);
}

.scale-fade-enter-to {
  opacity: 1;
  transform: scaleY(1);
}

.scale-fade-leave-from {
  opacity: 1;
  transform: scaleY(1);
}

.scale-fade-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

</style>
