<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, ChevronDown } from 'lucide-vue-next'
import { intraLineDiff, GHOST } from '@/utils/stringDiff'
import type { DiffPair } from '@/utils/stringDiff'
import type { FlatDiffNode } from '@/composables/useDiffView'
import DiffIndent from '@/components/DiffIndent.vue'
import DiffKeyRow from '@/components/DiffKeyRow.vue'

interface Props {
  diffContext: ReturnType<typeof import('@/composables/useDiffView')['useDiffView']>
  labelA?: string
  labelB?: string
}

const props = withDefaults(defineProps<Props>(), {
  labelA: 'Before',
  labelB: 'After',
})

const { visibleNodes, collapsedSet, toggleCollapse, isStringDiffNode, diffPairsMap, allChanges, currentChangeIdx, formatPrimitive, collapsedLabel, keyClass, valueClass, rowBgClass, stringDiffColors } = props.diffContext

const containerRef = ref<HTMLElement | null>(null)

const activeChangeEntry = computed(() => allChanges.value[currentChangeIdx.value])

function handleScrollToChange(payload: { nodeId: string; stringLineIdx: number | null }) {
  const row = containerRef.value?.querySelector(`[data-diff-id="${payload.nodeId}"]`)
  if (!row) return
  if (payload.stringLineIdx !== null) {
    const span = row.querySelector(`[data-sdiff-line="${payload.stringLineIdx}"]`)
    ;(span ?? row).scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } else {
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

defineExpose({ handleScrollToChange })

function getIntraLineHtml(pair: DiffPair): { leftHtml: string; rightHtml: string } | null {
  if (pair.type !== 'modified') return null
  return intraLineDiff(pair.left, pair.right, stringDiffColors)
}

function isNodeActive(node: FlatDiffNode): boolean {
  const entry = activeChangeEntry.value
  if (!entry) return false
  if (entry.nodeId !== node.id) return false
  return entry.stringLineIdx === null
}
</script>

<template>
  <div ref="containerRef" class="diff-view font-mono text-sm select-text overflow-x-auto">
    <!-- Column headers -->
    <div class="grid grid-cols-2 gap-px mb-1">
      <div class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-tl rounded-bl text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
        {{ labelA }}
      </div>
      <div class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-tr rounded-br text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
        {{ labelB }}
      </div>
    </div>

    <!-- Diff rows -->
    <div
      v-for="node in visibleNodes"
      :key="node.id"
      :data-diff-id="node.id"
      :class="{
        'cursor-pointer': node.isCollapsible,
        'outline outline-blue-400/70 dark:outline-blue-500/70 -outline-offset-1': isNodeActive(node),
      }"
      @click="node.isCollapsible ? toggleCollapse(node) : undefined"
    >
      <!-- String diff node: table-based for alignment -->
      <template v-if="isStringDiffNode(node)">
        <div class="grid grid-cols-2">
          <!-- Key row -->
          <DiffKeyRow
            :depth="node.depth"
            :label="node.key"
            :status="node.status"
            side="left"
            :is-collapsible="node.isCollapsible"
            :is-collapsed="collapsedSet.has(node.id)"
            :key-class="keyClass"
          />
          <DiffKeyRow
            :depth="node.depth"
            :label="node.key"
            :status="node.status"
            side="right"
            :is-collapsible="node.isCollapsible"
            :is-collapsed="collapsedSet.has(node.id)"
            :key-class="keyClass"
          />

          <!-- Diff pairs as table rows -->
          <template v-if="!collapsedSet.has(node.id)">
            <template v-for="(pair, pairIdx) in diffPairsMap.get(node.id)" :key="pairIdx">
              <!-- Same -->
              <template v-if="pair.type === 'same'">
                <div
                  class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 text-orange-500 dark:text-orange-400"
                  :data-sdiff-line="pairIdx"
                >
                  <DiffIndent :depth="node.depth + 1" />
                  <span class="diff-pre-wrap">{{ pair.line }}</span>
                </div>
                <div
                  class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 text-orange-500 dark:text-orange-400"
                >
                  <DiffIndent :depth="node.depth + 1" />
                  <span class="diff-pre-wrap">{{ pair.line }}</span>
                </div>
              </template>

              <!-- Remove -->
              <template v-else-if="pair.type === 'remove'">
                <div
                  class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 bg-red-500/20 dark:bg-red-700/20"
                  :data-sdiff-line="pairIdx"
                >
                  <DiffIndent :depth="node.depth + 1" />
                  <span class="text-red-700 dark:text-red-300 diff-pre-wrap">{{ pair.line }}</span>
                </div>
                <div
                  class="flex items-baseline gap-1 px-2 py-0.5 min-h-6"
                >
                  <DiffIndent :depth="node.depth + 1" />
                  <span v-html="GHOST" />
                </div>
              </template>

              <!-- Add -->
              <template v-else-if="pair.type === 'add'">
                <div
                  class="flex items-baseline gap-1 px-2 py-0.5 min-h-6"
                >
                  <DiffIndent :depth="node.depth + 1" />
                  <span v-html="GHOST" />
                </div>
                <div
                  class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 bg-green-500/20 dark:bg-green-700/20"
                  :data-sdiff-line="pairIdx"
                >
                  <DiffIndent :depth="node.depth + 1" />
                  <span class="text-green-700 dark:text-green-300 diff-pre-wrap">{{ pair.line }}</span>
                </div>
              </template>

              <!-- Modified -->
              <template v-else-if="pair.type === 'modified'">
                <div
                  class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 bg-yellow-400/10 dark:bg-yellow-600/10"
                  :data-sdiff-line="pairIdx"
                >
                  <DiffIndent :depth="node.depth + 1" />
                  <span class="text-orange-500 dark:text-orange-400 leading-5" v-html="getIntraLineHtml(pair)?.leftHtml" />
                </div>
                <div
                  class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 bg-yellow-400/10 dark:bg-yellow-600/10"
                >
                  <DiffIndent :depth="node.depth + 1" />
                  <span class="text-orange-500 dark:text-orange-400 leading-5" v-html="getIntraLineHtml(pair)?.rightHtml" />
                </div>
              </template>
            </template>
          </template>
        </div>
      </template>

      <!-- Non-string-diff node: existing grid-cols-2 -->
      <template v-else>
        <div class="grid grid-cols-2">
          <!-- Left cell -->
          <div
            class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 transition-colors"
            :class="rowBgClass(node.status, 'left', node)"
          >
            <DiffIndent :depth="node.depth" />

            <template v-if="node.leftPresent">
              <span :class="keyClass(node.status, 'left')" class="shrink-0 whitespace-nowrap">{{ node.key }}:</span>

              <template v-if="node.isCollapsible && collapsedSet.has(node.id)">
                <span :class="valueClass(node.status, 'left')" class="ml-1 text-xs opacity-80 whitespace-nowrap">
                  {{ collapsedLabel(node, 'left') }}
                </span>
              </template>
              <template v-else-if="!node.leftIsComplex">
                <span :class="valueClass(node.status, 'left')" class="ml-1 diff-pre-wrap">
                  {{ formatPrimitive(node.leftValue) }}
                </span>
              </template>
            </template>
            <template v-else>
              <span class="text-gray-300 dark:text-gray-700 text-xs">—</span>
            </template>
          </div>

          <!-- Right cell -->
          <div
            class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 transition-colors"
            :class="rowBgClass(node.status, 'right', node)"
          >
            <DiffIndent :depth="node.depth" />

            <template v-if="node.rightPresent">
              <span :class="keyClass(node.status, 'right')" class="shrink-0 whitespace-nowrap">{{ node.key }}:</span>

              <template v-if="node.isCollapsible && collapsedSet.has(node.id)">
                <span :class="valueClass(node.status, 'right')" class="ml-1 text-xs opacity-80 whitespace-nowrap">
                  {{ collapsedLabel(node, 'right') }}
                </span>
              </template>
              <template v-else-if="!node.rightIsComplex">
                <span :class="valueClass(node.status, 'right')" class="ml-1 diff-pre-wrap">
                  {{ formatPrimitive(node.rightValue) }}
                </span>
              </template>
            </template>
            <template v-else>
              <span class="text-gray-300 dark:text-gray-700 text-xs">—</span>
            </template>

            <span v-if="node.isCollapsible" class="ml-auto shrink-0 text-gray-400 dark:text-gray-500 self-center">
              <ChevronRight v-if="collapsedSet.has(node.id)" class="w-3 h-3" />
              <ChevronDown v-else class="w-3 h-3" />
            </span>
          </div>
        </div>
      </template>
    </div>

    <!-- Empty state -->
    <div v-if="visibleNodes.length === 0" class="text-center py-6 text-gray-400 dark:text-gray-600 text-xs">
      No properties to display
    </div>
  </div>
</template>

<style scoped>
.diff-pre-wrap {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
