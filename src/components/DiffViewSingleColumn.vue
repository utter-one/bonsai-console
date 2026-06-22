<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, ChevronDown } from 'lucide-vue-next'
import { intraLineDiff } from '@/utils/stringDiff'
import type { DiffPair } from '@/utils/stringDiff'
import type { FlatDiffNode } from '@/composables/useDiffView'
import DiffIndent from '@/components/DiffIndent.vue'

interface Props {
  diffContext: ReturnType<typeof import('@/composables/useDiffView')['useDiffView']>
}

const props = defineProps<Props>()

const { visibleNodes, collapsedSet, toggleCollapse, isStringDiffNode, diffPairsMap, allChanges, currentChangeIdx, formatPrimitive, collapsedLabel, effectiveSide, keyClass, valueClass, stringDiffColors } = props.diffContext

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

function nodeBgClass(node: FlatDiffNode): string {
  if (node.status === 'same') return ''
  if (node.status === 'deleted') return 'bg-red-50 dark:bg-red-900/10'
  if (node.status === 'added') return 'bg-green-50 dark:bg-green-900/10'
  if (node.status === 'modified') return 'bg-yellow-50 dark:bg-yellow-900/10'
  return ''
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
    <div
      v-for="node in visibleNodes"
      :key="node.id"
      :data-diff-id="node.id"
      class="transition-colors"
      :class="[
        nodeBgClass(node),
        { 'cursor-pointer': node.isCollapsible },
        { 'outline outline-blue-400/70 dark:outline-blue-500/70 -outline-offset-1': isNodeActive(node) },
      ]"
      @click="node.isCollapsible ? toggleCollapse(node) : undefined"
    >
      <!-- String diff node -->
      <template v-if="isStringDiffNode(node)">
        <!-- Key row -->
        <div class="flex items-baseline gap-1 px-2 py-0.5 min-h-6">
          <DiffIndent :depth="node.depth" />
          <span :class="keyClass(node.status, 'left')" class="shrink-0 whitespace-nowrap">{{ node.key }}:</span>
          <span v-if="node.isCollapsible" class="ml-auto shrink-0 text-gray-400 dark:text-gray-500 self-center">
            <ChevronRight v-if="collapsedSet.has(node.id)" class="w-3 h-3" />
            <ChevronDown v-else class="w-3 h-3" />
          </span>
        </div>

        <!-- Diff pairs -->
        <template v-if="!collapsedSet.has(node.id)">
          <template v-for="(pair, pairIdx) in diffPairsMap.get(node.id)" :key="pairIdx">
            <!-- Same -->
            <div
              v-if="pair.type === 'same'"
              class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 text-orange-500 dark:text-orange-400"
              :data-sdiff-line="pairIdx"
            >
              <DiffIndent :depth="node.depth + 1" />
              <span class="ml-1 diff-pre-wrap">{{ pair.line }}</span>
            </div>

            <!-- Remove -->
            <div
              v-else-if="pair.type === 'remove'"
              class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 bg-red-500/20 dark:bg-red-700/20"
              :data-sdiff-line="pairIdx"
            >
              <DiffIndent :depth="node.depth + 1" />
              <span class="text-red-500 dark:text-red-400 select-none font-bold leading-5">-</span>
              <span class="ml-1 text-red-700 dark:text-red-300 diff-pre-wrap">{{ pair.line }}</span>
            </div>

            <!-- Add -->
            <div
              v-else-if="pair.type === 'add'"
              class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 bg-green-500/20 dark:bg-green-700/20"
              :data-sdiff-line="pairIdx"
            >
              <DiffIndent :depth="node.depth + 1" />
              <span class="text-green-600 dark:text-green-400 select-none font-bold leading-5">+</span>
              <span class="ml-1 text-green-700 dark:text-green-300 diff-pre-wrap">{{ pair.line }}</span>
            </div>

            <!-- Modified (two stacked rows) -->
            <template v-else-if="pair.type === 'modified'">
              <div
                class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 bg-red-500/20 dark:bg-red-700/20"
                :data-sdiff-line="pairIdx"
              >
                <DiffIndent :depth="node.depth + 1" />
                <span class="text-red-500 dark:text-red-400 select-none font-bold leading-5">-</span>
                <span class="ml-1 text-red-700 dark:text-red-300 leading-5" v-html="getIntraLineHtml(pair)?.leftHtml" />
              </div>
              <div
                class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 bg-green-500/20 dark:bg-green-700/20"
              >
                <DiffIndent :depth="node.depth + 1" />
                <span class="text-green-600 dark:text-green-400 select-none font-bold leading-5">+</span>
                <span class="ml-1 text-green-700 dark:text-green-300 leading-5" v-html="getIntraLineHtml(pair)?.rightHtml" />
              </div>
            </template>
          </template>
        </template>
      </template>

      <!-- Non-string-diff node -->
      <template v-else>
        <!-- Modified non-string primitive: key header + two stacked diff rows -->
        <template v-if="node.status === 'modified' && !node.leftIsComplex && !node.rightIsComplex">
          <div class="flex items-baseline gap-1 px-2 py-0.5 min-h-6">
            <DiffIndent :depth="node.depth" />
            <span :class="keyClass(node.status, 'left')" class="shrink-0 whitespace-nowrap">{{ node.key }}:</span>
          </div>
          <div class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 bg-red-500/20 dark:bg-red-700/20">
            <DiffIndent :depth="node.depth + 1" />
            <span class="text-red-500 dark:text-red-400 select-none font-bold leading-5">-</span>
            <span class="ml-1 text-red-700 dark:text-red-300 diff-pre-wrap">
              {{ formatPrimitive(node.leftValue) }}
            </span>
          </div>
          <div class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 bg-green-500/20 dark:bg-green-700/20">
            <DiffIndent :depth="node.depth + 1" />
            <span class="text-green-600 dark:text-green-400 select-none font-bold leading-5">+</span>
            <span class="ml-1 text-green-700 dark:text-green-300 diff-pre-wrap">
              {{ formatPrimitive(node.rightValue) }}
            </span>
          </div>
        </template>

        <!-- All other statuses: single row -->
        <template v-else>
          <div class="flex items-baseline gap-1 px-2 py-0.5 min-h-6">
            <DiffIndent :depth="node.depth" />

            <template v-if="node.leftPresent || node.rightPresent">
              <span :class="keyClass(node.status, effectiveSide(node.status))" class="shrink-0 whitespace-nowrap">{{ node.key }}:</span>

              <!-- Collapsed complex -->
              <template v-if="node.isCollapsible && collapsedSet.has(node.id)">
                <span :class="valueClass(node.status, effectiveSide(node.status))" class="ml-1 text-xs opacity-80 whitespace-nowrap">
                  {{ collapsedLabel(node, effectiveSide(node.status)) }}
                </span>
              </template>

              <!-- Deleted primitive -->
              <template v-else-if="node.status === 'deleted' && !node.leftIsComplex">
                <span class="text-red-500 dark:text-red-400 select-none font-bold leading-5">-</span>
                <span class="ml-1 text-red-700 dark:text-red-300 diff-pre-wrap">
                  {{ formatPrimitive(node.leftValue) }}
                </span>
              </template>

              <!-- Added primitive -->
              <template v-else-if="node.status === 'added' && !node.rightIsComplex">
                <span class="text-green-600 dark:text-green-400 select-none font-bold leading-5">+</span>
                <span class="ml-1 text-green-700 dark:text-green-300 diff-pre-wrap">
                  {{ formatPrimitive(node.rightValue) }}
                </span>
              </template>

              <!-- Same primitive -->
              <template v-else-if="node.status === 'same' && !node.leftIsComplex">
                <span class="ml-1 text-orange-500 dark:text-orange-400 diff-pre-wrap">
                  {{ formatPrimitive(node.leftValue) }}
                </span>
              </template>

              <!-- Chevron for collapsible -->
              <span v-if="node.isCollapsible" class="ml-auto shrink-0 text-gray-400 dark:text-gray-500 self-center">
                <ChevronRight v-if="collapsedSet.has(node.id)" class="w-3 h-3" />
                <ChevronDown v-else class="w-3 h-3" />
              </span>
            </template>

            <!-- Absent -->
            <template v-else>
              <span class="text-gray-300 dark:text-gray-700 text-xs">—</span>
            </template>
          </div>
        </template>
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
