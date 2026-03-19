<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronRight, ChevronDown } from 'lucide-vue-next'

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

interface FlatDiffNode {
  id: string
  key: string
  depth: number
  parentId: string | null
  status: 'same' | 'modified' | 'deleted' | 'added'
  leftValue: any
  rightValue: any
  leftPresent: boolean
  rightPresent: boolean
  leftIsComplex: boolean
  rightIsComplex: boolean
  isCollapsible: boolean
  leftChildCount: number
  rightChildCount: number
  leftIsArray: boolean
  rightIsArray: boolean
}

function isComplex(val: any): boolean {
  return val !== null && val !== undefined && typeof val === 'object'
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every(k => k in b && deepEqual(a[k], b[k]))
}

function mergeKeys(a: any, b: any): string[] {
  const aIsArray = Array.isArray(a)
  const bIsArray = Array.isArray(b)
  if (aIsArray && bIsArray) {
    const len = Math.max(a?.length ?? 0, b?.length ?? 0)
    return Array.from({ length: len }, (_, i) => String(i))
  }
  // One or both are objects (or one is an array treated as object with numeric keys)
  const aKeys: string[] = aIsArray
    ? Array.from({ length: a?.length ?? 0 }, (_: any, i: number) => String(i))
    : Object.keys(a ?? {})
  const bKeys: string[] = bIsArray
    ? Array.from({ length: b?.length ?? 0 }, (_: any, i: number) => String(i))
    : Object.keys(b ?? {})
  const result = [...aKeys]
  for (const k of bKeys) {
    if (!result.includes(k)) result.push(k)
  }
  return result
}

function buildFlatNodes(a: any, b: any, parentId: string | null, depth: number): FlatDiffNode[] {
  if ((a === null || a === undefined) && (b === null || b === undefined)) return []

  const aIsArray = Array.isArray(a)
  const bIsArray = Array.isArray(b)
  const keys = mergeKeys(a, b)
  const nodes: FlatDiffNode[] = []

  for (const key of keys) {
    const id = parentId ? `${parentId}.${key}` : key

    const inA = a !== null && a !== undefined && (aIsArray ? parseInt(key) < a.length : key in a)
    const inB = b !== null && b !== undefined && (bIsArray ? parseInt(key) < b.length : key in b)

    const aVal = inA ? (a as any)[key] : undefined
    const bVal = inB ? (b as any)[key] : undefined

    const leftIsComplex = isComplex(aVal)
    const rightIsComplex = isComplex(bVal)

    let status: FlatDiffNode['status']
    if (inA && !inB) status = 'deleted'
    else if (!inA && inB) status = 'added'
    else if (deepEqual(aVal, bVal)) status = 'same'
    else {
      const aIsNully = aVal === null || aVal === undefined
      const bIsNully = bVal === null || bVal === undefined
      if (aIsNully && !bIsNully && bVal !== '') status = 'added'
      else if (!aIsNully && bIsNully && aVal !== '') status = 'deleted'
      else status = 'modified'
    }

    const leftChildCount = leftIsComplex
      ? (Array.isArray(aVal) ? aVal.length : Object.keys(aVal).length)
      : 0
    const rightChildCount = rightIsComplex
      ? (Array.isArray(bVal) ? bVal.length : Object.keys(bVal).length)
      : 0

    nodes.push({
      id,
      key,
      depth,
      parentId,
      status,
      leftValue: aVal,
      rightValue: bVal,
      leftPresent: inA && !(status === 'added' && (aVal === null || aVal === undefined)),
      rightPresent: inB && !(status === 'deleted' && (bVal === null || bVal === undefined)),
      leftIsComplex,
      rightIsComplex,
      isCollapsible: leftIsComplex || rightIsComplex,
      leftChildCount,
      rightChildCount,
      leftIsArray: Array.isArray(aVal),
      rightIsArray: Array.isArray(bVal),
    })

    if (leftIsComplex || rightIsComplex) {
      const childA = leftIsComplex ? aVal : (Array.isArray(bVal) ? [] : {})
      const childB = rightIsComplex ? bVal : (Array.isArray(aVal) ? [] : {})
      nodes.push(...buildFlatNodes(childA, childB, id, depth + 1))
    }
  }

  return nodes
}

const allNodes = computed<FlatDiffNode[]>(() =>
  buildFlatNodes(props.objectA ?? {}, props.objectB ?? {}, null, 0)
)

const collapsedSet = ref(new Set<string>())

watch(allNodes, (nodes) => {
  const collapsed = new Set<string>()
  for (const node of nodes) {
    if (node.isCollapsible && node.status === 'same') collapsed.add(node.id)
  }
  collapsedSet.value = collapsed
}, { immediate: true })

const nodeMap = computed(() => {
  const map = new Map<string, FlatDiffNode>()
  for (const node of allNodes.value) map.set(node.id, node)
  return map
})

const visibleNodes = computed(() => {
  return allNodes.value.filter(node => {
    let parentId = node.parentId
    while (parentId !== null) {
      if (collapsedSet.value.has(parentId)) return false
      parentId = nodeMap.value.get(parentId)?.parentId ?? null
    }
    return true
  })
})

function toggleCollapse(node: FlatDiffNode) {
  if (!node.isCollapsible) return
  const next = new Set(collapsedSet.value)
  if (next.has(node.id)) next.delete(node.id)
  else next.add(node.id)
  collapsedSet.value = next
}

function formatPrimitive(val: any): string {
  if (val === null) return 'null'
  if (val === undefined) return ''
  if (typeof val === 'string') return val
  return String(val)
}

function collapsedLabel(node: FlatDiffNode, side: 'left' | 'right'): string {
  const isArr = side === 'left' ? node.leftIsArray : node.rightIsArray
  const count = side === 'left' ? node.leftChildCount : node.rightChildCount
  if (!node.leftPresent && side === 'left') return ''
  if (!node.rightPresent && side === 'right') return ''
  return isArr ? `[ ${count} ]` : `{ ${count} }`
}

function keyClass(status: FlatDiffNode['status'], side: 'left' | 'right'): string {
  if (side === 'left') {
    if (status === 'deleted') return 'text-red-500 dark:text-red-400'
    if (status === 'modified') return 'text-yellow-600 dark:text-yellow-400'
    if (status === 'added') return 'text-gray-400 dark:text-gray-600'
    return 'text-blue-500 dark:text-blue-400'
  } else {
    if (status === 'added') return 'text-green-600 dark:text-green-400'
    if (status === 'modified') return 'text-yellow-600 dark:text-yellow-400'
    if (status === 'deleted') return 'text-gray-400 dark:text-gray-600'
    return 'text-blue-500 dark:text-blue-400'
  }
}

function valueClass(status: FlatDiffNode['status'], side: 'left' | 'right'): string {
  if (side === 'left') {
    if (status === 'deleted') return 'text-red-500 dark:text-red-400'
    if (status === 'modified') return 'text-yellow-600 dark:text-yellow-400'
    if (status === 'added') return 'text-gray-400 dark:text-gray-600'
    return 'text-orange-500 dark:text-orange-400'
  } else {
    if (status === 'added') return 'text-green-600 dark:text-green-400'
    if (status === 'modified') return 'text-yellow-600 dark:text-yellow-400'
    if (status === 'deleted') return 'text-gray-400 dark:text-gray-600'
    return 'text-orange-500 dark:text-orange-400'
  }
}

function rowBgClass(status: FlatDiffNode['status'], side: 'left' | 'right'): string {
  if (status === 'modified') return 'bg-yellow-50 dark:bg-yellow-900/10'
  if (side === 'left' && status === 'deleted') return 'bg-red-50 dark:bg-red-900/10'
  if (side === 'right' && status === 'added') return 'bg-green-50 dark:bg-green-900/10'
  return ''
}
</script>

<template>
  <div class="diff-view font-mono text-sm select-text overflow-x-auto">
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
      class="grid grid-cols-2 gap-px"
      :class="{ 'cursor-pointer': node.isCollapsible }"
      @click="node.isCollapsible ? toggleCollapse(node) : undefined"
    >
      <!-- Left cell -->
      <div
        class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 transition-colors"
        :class="rowBgClass(node.status, 'left')"
      >
        <!-- Indentation -->
        <span class="shrink-0 select-none" :style="{ width: `${node.depth * 1.25}rem`, display: 'inline-block' }" />

        <template v-if="node.leftPresent">
          <span :class="keyClass(node.status, 'left')" class="shrink-0 whitespace-nowrap">{{ node.key }}:</span>

          <!-- Collapsed complex -->
          <template v-if="node.isCollapsible && collapsedSet.has(node.id)">
            <span :class="valueClass(node.status, 'left')" class="ml-1 text-xs opacity-80 whitespace-nowrap">
              {{ collapsedLabel(node, 'left') }}
            </span>
          </template>
          <!-- Primitive -->
          <template v-else-if="!node.leftIsComplex">
            <span :class="valueClass(node.status, 'left')" class="ml-1 break-all">
              {{ formatPrimitive(node.leftValue) }}
            </span>
          </template>
          <!-- Expanded complex: no value shown (children follow) -->
        </template>
        <!-- Absent on left -->
        <template v-else>
          <span class="text-gray-300 dark:text-gray-700 text-xs">—</span>
        </template>
      </div>

      <!-- Right cell -->
      <div
        class="flex items-baseline gap-1 px-2 py-0.5 min-h-6 transition-colors"
        :class="rowBgClass(node.status, 'right')"
      >
        <!-- Indentation -->
        <span class="shrink-0 select-none" :style="{ width: `${node.depth * 1.25}rem`, display: 'inline-block' }" />

        <template v-if="node.rightPresent">
          <span :class="keyClass(node.status, 'right')" class="shrink-0 whitespace-nowrap">{{ node.key }}:</span>

          <!-- Collapsed complex -->
          <template v-if="node.isCollapsible && collapsedSet.has(node.id)">
            <span :class="valueClass(node.status, 'right')" class="ml-1 text-xs opacity-80 whitespace-nowrap">
              {{ collapsedLabel(node, 'right') }}
            </span>
          </template>
          <!-- Primitive -->
          <template v-else-if="!node.rightIsComplex">
            <span :class="valueClass(node.status, 'right')" class="ml-1 break-all">
              {{ formatPrimitive(node.rightValue) }}
            </span>
          </template>
          <!-- Expanded complex: chevron on right -->
          <template v-else-if="node.isCollapsible && !collapsedSet.has(node.id)">
            <!-- nothing; chevron below -->
          </template>
        </template>
        <!-- Absent on right -->
        <template v-else>
          <span class="text-gray-300 dark:text-gray-700 text-xs">—</span>
        </template>

        <!-- Chevron at far right of right cell for collapsible nodes -->
        <span v-if="node.isCollapsible" class="ml-auto shrink-0 text-gray-400 dark:text-gray-500 self-center">
          <ChevronRight v-if="collapsedSet.has(node.id)" class="w-3 h-3" />
          <ChevronDown v-else class="w-3 h-3" />
        </span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="visibleNodes.length === 0" class="text-center py-6 text-gray-400 dark:text-gray-600 text-xs">
      No properties to display
    </div>
  </div>
</template>
