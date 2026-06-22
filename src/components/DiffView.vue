<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ChevronUp, ChevronDown, Columns2, List } from 'lucide-vue-next'
import { useDiffView } from '@/composables/useDiffView'
import DiffViewTwoColumn from '@/components/DiffViewTwoColumn.vue'
import DiffViewSingleColumn from '@/components/DiffViewSingleColumn.vue'

interface Props {
  objectA: Record<string, any> | null
  objectB: Record<string, any> | null
  labelA?: string
  labelB?: string
}

const props = withDefaults(defineProps<Props>(), {
  labelA: 'Before',
  labelB: 'After',
})

const twoColumnRef = ref<InstanceType<typeof DiffViewTwoColumn> | null>(null)
const singleColumnRef = ref<InstanceType<typeof DiffViewSingleColumn> | null>(null)

const singleColumn = ref(false)

function persistMode() {
  localStorage.setItem('diffview-singlecol', String(singleColumn.value))
}

onMounted(() => {
  const stored = localStorage.getItem('diffview-singlecol')
  if (stored !== null) {
    singleColumn.value = stored === 'true'
  }
})

const diffContext = useDiffView(
  { objectA: props.objectA, objectB: props.objectB },
  (payload) => {
    if (singleColumn.value) {
      singleColumnRef.value?.handleScrollToChange(payload)
    } else {
      twoColumnRef.value?.handleScrollToChange(payload)
    }
  }
)

const { allChanges, currentChangeIdx } = diffContext

function toggleView() {
  singleColumn.value = !singleColumn.value
  persistMode()
}
</script>

<template>
  <div class="relative">
    <!-- Toggle button -->
    <div class="flex justify-end mb-1">
      <button
        type="button"
        class="btn-icon"
        :title="singleColumn ? 'Two-column view' : 'Single-column view'"
        @click="toggleView"
      >
        <Columns2 v-if="!singleColumn" class="w-4 h-4" />
        <List v-else class="w-4 h-4" />
      </button>
    </div>

    <div :class="{ 'pb-14': allChanges.length > 0 }">
      <DiffViewTwoColumn
        v-if="!singleColumn"
        ref="twoColumnRef"
        :diff-context="diffContext"
        :label-a="labelA"
        :label-b="labelB"
      />
      <DiffViewSingleColumn
        v-else
        ref="singleColumnRef"
        :diff-context="diffContext"
      />
    </div>

    <!-- Change navigation widget -->
    <div
      v-if="allChanges.length > 0"
      class="fixed bottom-6 right-8 z-10 flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
    >
      <button
        type="button"
        class="btn-icon"
        :disabled="currentChangeIdx <= 0"
        title="Previous change"
        @click="diffContext.navigatePrev"
      >
        <ChevronUp class="w-4 h-4" />
      </button>
      <span
        class="text-xs font-mono font-semibold text-gray-700 dark:text-gray-200 cursor-pointer select-none px-2 py-1 leading-5"
        title="Scroll to current change"
        @click="diffContext.scrollToChange(currentChangeIdx)"
      >{{ currentChangeIdx + 1 }}/{{ allChanges.length }}</span>
      <button
        type="button"
        class="btn-icon"
        :disabled="currentChangeIdx >= allChanges.length - 1"
        title="Next change"
        @click="diffContext.navigateNext"
      >
        <ChevronDown class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
