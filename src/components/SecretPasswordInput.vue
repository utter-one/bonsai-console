<script setup lang="ts">
import { ref, computed } from 'vue'
import { Eye } from 'lucide-vue-next'
import RevealSecretModal from '@/components/RevealSecretModal.vue'

defineOptions({ inheritAttrs: false })

const modelValue = defineModel<string>({ default: '' })

const showRevealModal = ref(false)

const isSecretRef = computed(() => Boolean(modelValue.value?.startsWith('@sec:')))
</script>

<template>
  <div class="flex gap-2 items-center">
    <input
      v-bind="$attrs"
      v-model="modelValue"
      type="password"
      class="flex-1 min-w-0"
    />
    <button
      v-if="isSecretRef"
      type="button"
      @click="showRevealModal = true"
      class="btn-icon shrink-0"
      title="Reveal secret value"
    >
      <Eye :size="16" />
    </button>
  </div>
  <RevealSecretModal
    v-if="showRevealModal"
    :secret-ref="modelValue"
    @close="showRevealModal = false"
  />
</template>
