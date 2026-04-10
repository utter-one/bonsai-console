<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  ListOrdered,
  Zap,
  Bug,
  ChevronRight,
  ChevronDown,
} from 'lucide-vue-next'
import type { NormalizedEvent } from './eventHelpers'
import { formatLifecycleContext, getEffectTypeClasses, formatEffectType, resolveName } from './eventHelpers'

const props = defineProps<{
  event: NormalizedEvent
  showBugReport?: boolean
  entityNames?: {
    stages?: Record<string, string>
  }
}>()

const emit = defineEmits<{
  (e: 'open-bug-report', event: NormalizedEvent): void
}>()

const route = useRoute()
// Chromium resolves url(#id) relative to the current page URL, so we must use
// the full absolute URL to ensure SVG marker references work correctly in SPAs.
const svgUrlBase = computed(() => window.location.origin + route.fullPath.replace(/#.*$/, ''))

const expanded = ref(false)

const EXECUTION_PLAN_COLORS = [
  { actionClasses: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700', stroke: '#9333ea' },
  { actionClasses: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700', stroke: '#2563eb' },
  { actionClasses: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700', stroke: '#10b981' },
  { actionClasses: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700', stroke: '#f97316' },
  { actionClasses: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-200 dark:border-pink-700', stroke: '#ec4899' },
  { actionClasses: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-700', stroke: '#14b8a6' },
  { actionClasses: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700', stroke: '#f59e0b' },
  { actionClasses: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700', stroke: '#6366f1' },
] as const

const executionPlanActionColorMap = computed<Record<string, number>>(() => {
  if (props.event.eventType !== 'execution_plan') return {}
  const actions: string[] = (props.event.eventData as any)?.actions ?? []
  const map: Record<string, number> = {}
  actions.forEach((name, idx) => { map[name] = idx % EXECUTION_PLAN_COLORS.length })
  return map
})

function getExecutionPlanActionClasses(idx: number): string {
  return (EXECUTION_PLAN_COLORS[idx % EXECUTION_PLAN_COLORS.length] ?? EXECUTION_PLAN_COLORS[0]).actionClasses
}

type ExecutionPlanDisplayedEffect =
  | { kind: 'normal'; effectEntry: any; displayIdx: number }
  | { kind: 'shared'; actionNames: string[]; displayIdx: number }

const executionPlanDisplayedEffects = computed<ExecutionPlanDisplayedEffect[]>(() => {
  if (props.event.eventType !== 'execution_plan') return []
  const effects: any[] = (props.event.eventData as any)?.effects ?? []

  const genRespActionNames = effects
    .filter(e => e.effect?.type === 'generate_response')
    .map(e => e.actionName)
  const isShared = genRespActionNames.length > 1

  const result: ExecutionPlanDisplayedEffect[] = []
  let sharedAdded = false

  for (const entry of effects) {
    if (entry.effect?.type === 'generate_response' && isShared) {
      if (!sharedAdded) {
        result.push({ kind: 'shared', actionNames: genRespActionNames, displayIdx: result.length })
        sharedAdded = true
      }
    } else {
      result.push({ kind: 'normal', effectEntry: entry, displayIdx: result.length })
    }
  }

  return result
})

const executionPlanContainerRef = ref<HTMLElement | null>(null)
const executionPlanActionBadgeRefs = new Map<string, HTMLElement>()
const executionPlanEffectBadgeRefs = new Map<number, HTMLElement>()
const executionPlanArrows = ref<{ path: string; color: string; colorIdx: number }[]>([])

function setActionBadgeRef(actionName: string, el: HTMLElement | null) {
  if (el) executionPlanActionBadgeRefs.set(actionName, el)
  else executionPlanActionBadgeRefs.delete(actionName)
}

function setEffectBadgeRef(idx: number, el: HTMLElement | null) {
  if (el) executionPlanEffectBadgeRefs.set(idx, el)
  else executionPlanEffectBadgeRefs.delete(idx)
}

async function recomputeExecutionPlanArrows() {
  await nextTick()
  const container = executionPlanContainerRef.value
  if (!container) {
    executionPlanArrows.value = []
    return
  }
  const containerRect = container.getBoundingClientRect()
  const paths: { path: string; color: string; colorIdx: number }[] = []

  for (const displayed of executionPlanDisplayedEffects.value) {
    const effectEl = executionPlanEffectBadgeRefs.get(displayed.displayIdx)
    if (!effectEl) continue

    const sourceActions = displayed.kind === 'shared'
      ? displayed.actionNames
      : [displayed.effectEntry.actionName]

    for (const actionName of sourceActions) {
      const actionEl = executionPlanActionBadgeRefs.get(actionName)
      if (!actionEl) continue

      const ar = actionEl.getBoundingClientRect()
      const er = effectEl.getBoundingClientRect()
      const x1 = ar.right - containerRect.left
      const y1 = ar.top + ar.height / 2 - containerRect.top
      const x2 = er.left - containerRect.left
      const y2 = er.top + er.height / 2 - containerRect.top
      const mx = (x1 + x2) / 2

      const colorIdx = executionPlanActionColorMap.value[actionName] ?? 0
      paths.push({
        path: `M${x1.toFixed(1)},${y1.toFixed(1)} C${mx.toFixed(1)},${y1.toFixed(1)} ${mx.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`,
        color: (EXECUTION_PLAN_COLORS[colorIdx] ?? EXECUTION_PLAN_COLORS[0]).stroke,
        colorIdx,
      })
    }
  }

  executionPlanArrows.value = paths
}

watch(expanded, (val) => {
  if (val) {
    recomputeExecutionPlanArrows()
  } else {
    executionPlanArrows.value = []
  }
})
</script>

<template>
  <div class="grid grid-cols-[auto_auto_1fr] gap-x-2">
    <button @click.stop="expanded = !expanded" class="place-self-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
      <ChevronDown v-if="expanded" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
    <ListOrdered class="place-self-center w-5 h-5 text-lime-600" />
    <div style="display:contents">
      <div class="min-w-0 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0 flex-wrap">
          <button @click="expanded = !expanded" class="font-semibold text-lime-900 dark:text-lime-100 shrink-0 text-left">Execution Plan</button>
          <span v-if="event.eventData.lifecycleContext"
            class="text-xs px-1.5 py-0.5 rounded bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300 shrink-0">
            {{ formatLifecycleContext(event.eventData.lifecycleContext) }}
          </span>
          <span v-if="!expanded" class="text-xs text-gray-400 shrink-0">
            {{ event.eventData.actions?.length ?? 0 }} action(s) · {{ event.eventData.effects?.length ?? 0 }} effect(s)
          </span>
          <span class="text-xs text-gray-400 shrink-0">{{ event.timestamp }}</span>
        </div>
        <div class="flex items-center gap-1 shrink-0" @click.stop>
          <button
            v-if="showBugReport"
            @click="emit('open-bug-report', event)"
            class="btn-icon p-1 hover:bg-lime-100 dark:hover:bg-lime-900/30"
            title="Report bug">
            <Bug class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-show="expanded" class="col-start-3 mt-3 space-y-3">
        <div v-if="event.eventData.stageId" class="text-xs text-gray-600 dark:text-gray-400">
          Stage: <span class="text-gray-900 dark:text-gray-200">{{ resolveName(event.eventData.stageId, entityNames?.stages) }}</span>
        </div>

        <div
          v-if="(event.eventData.actions?.length ?? 0) > 0 || (event.eventData.effects?.length ?? 0) > 0"
          ref="executionPlanContainerRef"
          class="relative"
        >
          <div class="grid grid-cols-2 gap-x-10">
            <!-- Left column: Actions -->
            <div class="flex flex-col gap-2">
              <div
                v-for="(action, idx) in (event.eventData.actions as string[])"
                :key="action"
                :ref="(el) => setActionBadgeRef(action, el as HTMLElement | null)"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border w-full"
                :class="getExecutionPlanActionClasses(idx)"
              >
                <Zap class="w-3 h-3 shrink-0" />
                <span class="truncate">{{ action }}</span>
              </div>
            </div>

            <!-- Right column: Effects in order -->
            <div class="flex flex-col gap-2">
              <template v-for="displayedEffect in executionPlanDisplayedEffects" :key="displayedEffect.displayIdx">
                <!-- Shared generate_response box -->
                <div
                  v-if="displayedEffect.kind === 'shared'"
                  :ref="(el) => setEffectBadgeRef(displayedEffect.displayIdx, el as HTMLElement | null)"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border w-full"
                  :class="getEffectTypeClasses('generate_response')"
                >
                  <span class="truncate">Generate Response</span>
                </div>
                <!-- Normal effect box -->
                <div
                  v-else
                  :ref="(el) => setEffectBadgeRef(displayedEffect.displayIdx, el as HTMLElement | null)"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border w-full"
                  :class="getEffectTypeClasses(displayedEffect.effectEntry?.effect?.type)"
                >
                  <span class="truncate">{{ formatEffectType(displayedEffect.effectEntry?.effect?.type) }}</span>
                </div>
              </template>
            </div>
          </div>

          <!-- SVG arrow overlay -->
          <!-- height: 100% ensures paths are within the SVG viewport; overflow="visible"
               is set as a native attribute because Chromium ignores the CSS override. -->
          <svg
            class="absolute top-0 left-0 w-full pointer-events-none"
            style="height: 100%"
            overflow="visible"
            aria-hidden="true"
          >
            <defs>
              <marker
                v-for="(color, idx) in EXECUTION_PLAN_COLORS"
                :key="idx"
                :id="`ep-ah-${event.id}-${idx}`"
                markerWidth="7"
                markerHeight="7"
                refX="6"
                refY="3.5"
                orient="auto"
              >
                <path d="M0,0 L7,3.5 L0,7 z" :fill="color.stroke" fill-opacity="0.65" />
              </marker>
            </defs>
            <path
              v-for="(arrow, idx) in executionPlanArrows"
              :key="idx"
              :d="arrow.path"
              fill="none"
              :stroke="arrow.color"
              stroke-width="1.5"
              stroke-opacity="0.65"
              :marker-end="`url(${svgUrlBase}#ep-ah-${event.id}-${arrow.colorIdx})`"
            />
          </svg>
        </div>

        <div v-if="event.eventData.metadata && Object.keys(event.eventData.metadata).length > 0">
          <details class="group">
            <summary class="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 select-none dark:text-gray-400 dark:hover:text-gray-200">
              Metadata ({{ Object.keys(event.eventData.metadata).length }})
            </summary>
            <div class="mt-1 bg-white bg-opacity-60 rounded p-2 font-mono text-xs overflow-x-auto dark:bg-gray-900 dark:bg-opacity-60">
              <pre class="whitespace-pre-wrap wrap-break-word dark:text-gray-300">{{ JSON.stringify(event.eventData.metadata, null, 2) }}</pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>
