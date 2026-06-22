import { ref, computed, watch } from 'vue'
import { computeStringDiffPairs, countDiffPairChanges, type DiffPair } from '@/utils/stringDiff'

export interface FlatDiffNode {
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
  if (Number.isNaN(a) && Number.isNaN(b)) return true
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

interface ChangeEntry {
  nodeId: string
  stringLineIdx: number | null
}

export interface UseDiffViewProps {
  objectA: Record<string, any> | null
  objectB: Record<string, any> | null
}

export function useDiffView(
  props: UseDiffViewProps,
  onScrollToChange: (payload: { nodeId: string; stringLineIdx: number | null }) => void
) {
  const allNodes = computed<FlatDiffNode[]>(() =>
    buildFlatNodes(props.objectA ?? {}, props.objectB ?? {}, null, 0)
  )

  const collapsedSet = ref(new Set<string>())
  const currentChangeIdx = ref(0)

  watch(allNodes, (nodes) => {
    const collapsed = new Set<string>()
    for (const node of nodes) {
      if (node.isCollapsible && node.status === 'same') collapsed.add(node.id)
    }
    collapsedSet.value = collapsed
    currentChangeIdx.value = 0
  }, { immediate: true })

  const nodeMap = computed(() => {
    const map = new Map<string, FlatDiffNode>()
    for (const node of allNodes.value) map.set(node.id, node)
    return map
  })

  const visibleNodes = computed(() => {
    const hidden = new Set<string>()
    const result: FlatDiffNode[] = []
    for (const node of allNodes.value) {
      if (node.parentId && collapsedSet.value.has(node.parentId)) hidden.add(node.id)
      if (!hidden.has(node.id)) result.push(node)
    }
    return result
  })

  function toggleCollapse(node: FlatDiffNode) {
    if (!node.isCollapsible) return
    const next = new Set(collapsedSet.value)
    if (next.has(node.id)) next.delete(node.id)
    else next.add(node.id)
    collapsedSet.value = next
  }

  function isStringDiffNode(node: FlatDiffNode): boolean {
    return (
      node.status === 'modified' &&
      !node.leftIsComplex &&
      !node.rightIsComplex &&
      typeof node.leftValue === 'string' &&
      typeof node.rightValue === 'string'
    )
  }

  const diffPairsMap = computed(() => {
    const map = new Map<string, DiffPair[]>()
    for (const node of visibleNodes.value) {
      if (!isStringDiffNode(node)) continue
      map.set(node.id, computeStringDiffPairs(node.leftValue as string, node.rightValue as string))
    }
    return map
  })

  const allChanges = computed<ChangeEntry[]>(() => {
    const entries: ChangeEntry[] = []
    for (const node of visibleNodes.value) {
      if (node.status === 'same') continue
      if (isStringDiffNode(node)) {
        const pairs = diffPairsMap.value.get(node.id)
        const count = pairs ? countDiffPairChanges(pairs) : 0
        for (let i = 0; i < count; i++) entries.push({ nodeId: node.id, stringLineIdx: i })
      } else {
        entries.push({ nodeId: node.id, stringLineIdx: null })
      }
    }
    return entries
  })

  function navigatePrev() {
    if (currentChangeIdx.value <= 0) return
    currentChangeIdx.value--
    const entry = allChanges.value[currentChangeIdx.value]
    if (entry) onScrollToChange(entry)
  }

  function navigateNext() {
    if (currentChangeIdx.value >= allChanges.value.length - 1) return
    currentChangeIdx.value++
    const entry = allChanges.value[currentChangeIdx.value]
    if (entry) onScrollToChange(entry)
  }

  function scrollToChange(idx: number) {
    const entry = allChanges.value[idx]
    if (!entry) return
    onScrollToChange(entry)
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

  function effectiveSide(status: FlatDiffNode['status']): 'left' | 'right' {
    if (status === 'added') return 'right'
    return 'left'
  }

  function keyClass(status: FlatDiffNode['status'], side: 'left' | 'right'): string {
    const keyColors: Record<FlatDiffNode['status'], Record<'left' | 'right', string>> = {
      same: { left: 'text-blue-500 dark:text-blue-400', right: 'text-blue-500 dark:text-blue-400' },
      modified: { left: 'text-yellow-600 dark:text-yellow-400', right: 'text-yellow-600 dark:text-yellow-400' },
      deleted: { left: 'text-red-500 dark:text-red-400', right: 'text-gray-400 dark:text-gray-600' },
      added: { left: 'text-gray-400 dark:text-gray-600', right: 'text-green-600 dark:text-green-400' },
    }
    return keyColors[status][side]
  }

  function valueClass(status: FlatDiffNode['status'], side: 'left' | 'right'): string {
    const valueColors: Record<FlatDiffNode['status'], Record<'left' | 'right', string>> = {
      same: { left: 'text-orange-500 dark:text-orange-400', right: 'text-orange-500 dark:text-orange-400' },
      modified: { left: 'text-yellow-600 dark:text-yellow-400', right: 'text-yellow-600 dark:text-yellow-400' },
      deleted: { left: 'text-red-700 dark:text-red-300', right: 'text-gray-400 dark:text-gray-600' },
      added: { left: 'text-gray-400 dark:text-gray-600', right: 'text-green-700 dark:text-green-300' },
    }
    return valueColors[status][side]
  }

  function rowBgClass(status: FlatDiffNode['status'], side: 'left' | 'right', node?: FlatDiffNode): string {
    if (node && isStringDiffNode(node)) return ''
    if (status === 'modified') return 'bg-yellow-50 dark:bg-yellow-900/10'
    if (side === 'left' && status === 'deleted') return 'bg-red-50 dark:bg-red-900/10'
    if (side === 'right' && status === 'added') return 'bg-green-50 dark:bg-green-900/10'
    return ''
  }

  const stringDiffColors = {
    lineRemove: 'bg-red-500/20 dark:bg-red-700/20',
    lineAdd: 'bg-green-500/20 dark:bg-green-700/20',
    lineModified: 'bg-yellow-400/10 dark:bg-yellow-600/10',
    markRemove: 'bg-red-300/40 dark:bg-red-500/40 rounded',
    markAdd: 'bg-green-500/45 dark:bg-green-700/45 rounded',
  }

  return {
    allNodes,
    collapsedSet,
    nodeMap,
    visibleNodes,
    toggleCollapse,
    isStringDiffNode,
    diffPairsMap,
    allChanges,
    currentChangeIdx,
    navigatePrev,
    navigateNext,
    scrollToChange,
    formatPrimitive,
    collapsedLabel,
    effectiveSide,
    keyClass,
    valueClass,
    rowBgClass,
    stringDiffColors,
  }
}
