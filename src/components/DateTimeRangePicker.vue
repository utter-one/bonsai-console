<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import { Calendar, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-vue-next'

export type DateTimeRange = {
  op: 'between'
  value: [string, string]
} | null

const PRESETS = [
  { label: 'Last 15 minutes', ms: 15 * 60 * 1000 },
  { label: 'Last 30 minutes', ms: 30 * 60 * 1000 },
  { label: 'Last 1 hour',     ms: 60 * 60 * 1000 },
  { label: 'Last 4 hours',    ms: 4 * 60 * 60 * 1000 },
  { label: 'Last 24 hours',   ms: 24 * 60 * 60 * 1000 },
  { label: 'Last 7 days',     ms: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Last 30 days',    ms: 30 * 24 * 60 * 60 * 1000 },
] as const

const props = withDefaults(defineProps<{
  modelValue: DateTimeRange
  placeholder?: string
}>(), {
  placeholder: 'Select date range',
})

const emit = defineEmits<{
  'update:modelValue': [value: DateTimeRange]
}>()

// ── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const SHORT_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

// ── State ────────────────────────────────────────────────────────────────────

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const popoverStyle = ref<Record<string, string>>({})

// Tracks which preset is currently active (null = custom range)
const activePresetLabel = ref<string | null>(null)

// Draft state (uncommitted until Apply)
const draftFrom = ref<Date | null>(null)
const draftTo = ref<Date | null>(null)
const fromH = ref(0)
const fromM = ref(0)
const fromS = ref(0)
const toH = ref(23)
const toM = ref(55)
const toS = ref(59)

// Calendar navigation (single calendar)
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())
const hoverDate = ref<Date | null>(null)
const isSelectingEnd = ref(false)

// ── Watchers ──────────────────────────────────────────────────────────────────

watch(() => props.modelValue, (val) => {
  if (!val) activePresetLabel.value = null
})

// ── Display helpers ───────────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatBtnDate(d: Date): string {
  return `${SHORT_MONTH[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const buttonLabel = computed(() => {
  if (!props.modelValue) return props.placeholder
  if (activePresetLabel.value) return activePresetLabel.value
  const [from, to] = props.modelValue.value
  return `${formatBtnDate(new Date(from))} – ${formatBtnDate(new Date(to))}`
})

const hasValue = computed(() => props.modelValue !== null)

// ── Calendar logic ────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

interface CalendarDay {
  date: Date
  day: number
  currentMonth: boolean
  isToday: boolean
  isStart: boolean
  isEnd: boolean
  isInRange: boolean
  isHoverEnd: boolean
  isHoverRange: boolean
}

function buildCalendarWeeks(year: number, month: number): CalendarDay[][] {
  const from = draftFrom.value
  const to = draftTo.value
  const hover = hoverDate.value ? startOfDay(hoverDate.value) : null
  const selecting = isSelectingEnd.value
  const todayStr = startOfDay(new Date()).toISOString()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const cells: CalendarDay[] = []

  // Pad from previous month
  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push(makeDay(new Date(year, month - 1, prevMonthDays - i), false))
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(makeDay(new Date(year, month, d), true))
  }

  // Pad to next month to fill out rows
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    cells.push(makeDay(new Date(year, month + 1, nextDay++), false))
  }

  function makeDay(rawDate: Date, currentMonth: boolean): CalendarDay {
    const d = startOfDay(rawDate)
    const isToday = d.toISOString() === todayStr

    const isStart = from != null && isSameDay(d, from)
    const isEnd = to != null && isSameDay(d, to)

    let isInRange = false
    let isHoverEnd = false
    let isHoverRange = false

    if (from && to) {
      isInRange = d > from && d < to
    } else if (from && hover && selecting) {
      if (hover >= from) {
        isHoverEnd = isSameDay(d, hover)
        isHoverRange = d > from && d < hover
      } else {
        // Hover is before start — swap preview
        isHoverEnd = isSameDay(d, hover)
        isHoverRange = d > hover && d < from
      }
    }

    return { date: d, day: rawDate.getDate(), currentMonth, isToday, isStart, isEnd, isInRange, isHoverEnd, isHoverRange }
  }

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

const calWeeks = computed(() => buildCalendarWeeks(calYear.value, calMonth.value))

function prevMonth() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else calMonth.value--
}

function nextMonth() {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else calMonth.value++
}

function onDayClick(date: Date) {
  activePresetLabel.value = null
  if (!isSelectingEnd.value) {
    draftFrom.value = date
    draftTo.value = null
    isSelectingEnd.value = true
  } else {
    const from = draftFrom.value!
    if (date < from) {
      draftFrom.value = date
      draftTo.value = from
    } else {
      draftTo.value = date
    }
    isSelectingEnd.value = false
    hoverDate.value = null
  }
}

function onDayHover(date: Date) {
  if (isSelectingEnd.value) hoverDate.value = date
}

// ── Time steppers ─────────────────────────────────────────────────────────────

const stepFromH = (d: number) => { fromH.value = (fromH.value + d + 24) % 24 }
const stepFromM = (d: number) => {
  const idx = MINUTE_STEPS.indexOf(fromM.value)
  fromM.value = MINUTE_STEPS[(idx + d + MINUTE_STEPS.length) % MINUTE_STEPS.length]!
}
const stepFromS = (d: number) => { fromS.value = (fromS.value + d + 60) % 60 }
const stepToH = (d: number) => { toH.value = (toH.value + d + 24) % 24 }
const stepToM = (d: number) => {
  const idx = MINUTE_STEPS.indexOf(toM.value)
  toM.value = MINUTE_STEPS[(idx + d + MINUTE_STEPS.length) % MINUTE_STEPS.length]!
}
const stepToS = (d: number) => { toS.value = (toS.value + d + 60) % 60 }

// ── Presets ───────────────────────────────────────────────────────────────────

function applyPreset(preset: typeof PRESETS[number]) {
  const now = new Date()
  const from = new Date(now.getTime() - preset.ms)
  activePresetLabel.value = preset.label
  emit('update:modelValue', { op: 'between', value: [from.toISOString(), now.toISOString()] })
  close()
}

// ── Open / close / apply ──────────────────────────────────────────────────────

function open() {
  const val = props.modelValue

  if (val) {
    const fromDate = new Date(val.value[0])
    const toDate = new Date(val.value[1])
    draftFrom.value = startOfDay(fromDate)
    fromH.value = fromDate.getHours()
    fromM.value = Math.round(fromDate.getMinutes() / 5) * 5 % 60
    fromS.value = fromDate.getSeconds()
    draftTo.value = startOfDay(toDate)
    toH.value = toDate.getHours()
    toM.value = Math.round(toDate.getMinutes() / 5) * 5 % 60
    toS.value = toDate.getSeconds()
    calYear.value = fromDate.getFullYear()
    calMonth.value = fromDate.getMonth()
  } else {
    draftFrom.value = null
    draftTo.value = null
    fromH.value = 0; fromM.value = 0; fromS.value = 0
    toH.value = 23; toM.value = 55; toS.value = 59
    const now = new Date()
    calYear.value = now.getFullYear()
    calMonth.value = now.getMonth()
  }

  isSelectingEnd.value = false
  hoverDate.value = null
  isOpen.value = true
  nextTick(updatePopoverPosition)
}

function close() {
  isOpen.value = false
  hoverDate.value = null
  isSelectingEnd.value = false
}

function apply() {
  if (!draftFrom.value) return
  const fromDate = new Date(draftFrom.value)
  fromDate.setHours(fromH.value, fromM.value, fromS.value, 0)
  const toDate = draftTo.value ? new Date(draftTo.value) : new Date(draftFrom.value)
  toDate.setHours(toH.value, toM.value, toS.value, 999)
  activePresetLabel.value = null
  emit('update:modelValue', { op: 'between', value: [fromDate.toISOString(), toDate.toISOString()] })
  close()
}

function clearAll() {
  activePresetLabel.value = null
  emit('update:modelValue', null)
  close()
}

// ── Popover positioning ───────────────────────────────────────────────────────

function updatePopoverPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const popoverWidth = 480
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - popoverWidth - 8))
  popoverStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${left}px`,
    zIndex: '500',
  }
}

function handleMouseDown(e: MouseEvent) {
  if (!isOpen.value) return
  if (triggerRef.value?.contains(e.target as Node)) return
  if (popoverRef.value?.contains(e.target as Node)) return
  close()
}

onMounted(() => {
  document.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('resize', updatePopoverPosition)
  window.addEventListener('scroll', updatePopoverPosition, { passive: true, capture: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleMouseDown)
  window.removeEventListener('resize', updatePopoverPosition)
  window.removeEventListener('scroll', updatePopoverPosition, true)
})

// ── Draft state label ─────────────────────────────────────────────────────────

const draftLabel = computed(() => {
  if (!draftFrom.value) return 'Click a date to start'
  if (isSelectingEnd.value) return `${formatBtnDate(draftFrom.value)}  — click a second date`
  if (draftTo.value) return `${formatBtnDate(draftFrom.value)} → ${formatBtnDate(draftTo.value)}`
  return formatBtnDate(draftFrom.value)
})
</script>

<template>
  <!-- Trigger button -->
  <button
    ref="triggerRef"
    type="button"
    class="filter-btn shadow-none!"
    :class="{ 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400': hasValue }"
    @click="isOpen ? close() : open()"
  >
    <Calendar class="w-4 h-4 mr-2 shrink-0" />
    <span class="truncate max-w-55">{{ buttonLabel }}</span>
    <button
      v-if="hasValue"
      type="button"
      class="ml-2 shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0 border-none bg-transparent cursor-pointer"
      @click.stop="clearAll"
      title="Clear date range"
    >
      <X class="w-3.5 h-3.5" />
    </button>
    <ChevronDown v-else class="w-4 h-4 ml-2 shrink-0" />
  </button>

  <!-- Popover -->
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="popoverRef"
      :style="popoverStyle"
      class="bg-white border border-gray-200 rounded-xl shadow-2xl dark:bg-gray-800 dark:border-gray-700 select-none flex"
      style="width: min(480px, calc(100vw - 16px))"
    >
      <!-- Left sidebar: presets -->
      <div class="w-36 shrink-0 border-r border-gray-200 dark:border-gray-700 py-2 flex flex-col">
        <p class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 py-1.5">
          Quick select
        </p>
        <button
          v-for="preset in PRESETS"
          :key="preset.label"
          type="button"
          class="text-left text-xs px-3 py-1.5 transition-colors border-none cursor-pointer"
          :class="activePresetLabel === preset.label
            ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-900/20 dark:text-primary-400'
            : 'text-gray-700 bg-transparent hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>

      <!-- Right: calendar + time pickers + footer -->
      <div class="flex-1 min-w-0 flex flex-col">
        <!-- Calendar -->
        <div class="p-3">
          <!-- Month header -->
          <div class="flex items-center justify-between mb-2">
            <button
              type="button"
              class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
              @click="prevMonth"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ MONTH_NAMES[calMonth] }} {{ calYear }}
            </span>
            <button
              type="button"
              class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
              @click="nextMonth"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>

          <!-- Day headers -->
          <div class="grid grid-cols-7 mb-0.5">
            <div
              v-for="h in DAY_HEADERS"
              :key="h"
              class="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 py-1"
            >
              {{ h }}
            </div>
          </div>

          <!-- Weeks -->
          <div v-for="(week, wi) in calWeeks" :key="wi" class="grid grid-cols-7">
            <button
              v-for="day in week"
              :key="day.date.toISOString()"
              type="button"
              class="relative py-0.5 cursor-pointer group"
              @click="onDayClick(day.date)"
              @mouseenter="onDayHover(day.date)"
            >
              <!-- Range fill -->
              <span
                v-if="day.isStart && (day.isEnd ? false : (draftTo || (isSelectingEnd && hoverDate)))"
                class="absolute inset-y-0 left-1/2 right-0 bg-primary-100 dark:bg-primary-900/30"
              ></span>
              <span
                v-if="day.isEnd && !day.isStart"
                class="absolute inset-y-0 left-0 right-1/2 bg-primary-100 dark:bg-primary-900/30"
              ></span>
              <span
                v-if="day.isInRange"
                class="absolute inset-y-0 left-0 right-0 bg-primary-100 dark:bg-primary-900/30"
              ></span>
              <!-- Hover range fill -->
              <span
                v-if="day.isHoverEnd && !day.isStart"
                class="absolute inset-y-0 left-0 right-1/2 bg-primary-100/60 dark:bg-primary-900/20"
              ></span>
              <span
                v-if="day.isHoverRange"
                class="absolute inset-y-0 left-0 right-0 bg-primary-100/60 dark:bg-primary-900/20"
              ></span>
              <!-- Day circle -->
              <span
                class="relative z-10 flex items-center justify-center w-7 h-7 mx-auto rounded-full text-xs transition-colors"
                :class="[
                  day.isStart || day.isEnd
                    ? 'bg-primary-500 text-white font-semibold'
                    : day.isHoverEnd
                      ? 'bg-primary-200 dark:bg-primary-700 text-primary-900 dark:text-white'
                      : !day.currentMonth
                        ? 'text-gray-300 dark:text-gray-600'
                        : 'text-gray-900 dark:text-gray-100 group-hover:bg-gray-100 dark:group-hover:bg-gray-700',
                  day.isToday && !day.isStart && !day.isEnd ? 'underline font-semibold' : '',
                ]"
              >
                {{ day.day }}
              </span>
            </button>
          </div>
        </div>

        <!-- Time pickers -->
        <div class="border-t border-gray-200 dark:border-gray-700 px-3 py-2">
          <div class="flex items-start gap-2">
            <!-- From time -->
            <div class="flex-1">
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">From</div>
              <div class="flex items-center gap-0.5">
                <div class="flex flex-col items-center">
                  <button type="button" class="time-spin-btn" @click="stepFromH(1)"><ChevronUp class="w-3 h-3" /></button>
                  <span class="time-spin-val">{{ pad(fromH) }}</span>
                  <button type="button" class="time-spin-btn" @click="stepFromH(-1)"><ChevronDown class="w-3 h-3" /></button>
                </div>
                <span class="time-sep">:</span>
                <div class="flex flex-col items-center">
                  <button type="button" class="time-spin-btn" @click="stepFromM(1)"><ChevronUp class="w-3 h-3" /></button>
                  <span class="time-spin-val">{{ pad(fromM) }}</span>
                  <button type="button" class="time-spin-btn" @click="stepFromM(-1)"><ChevronDown class="w-3 h-3" /></button>
                </div>
                <span class="time-sep">:</span>
                <div class="flex flex-col items-center">
                  <button type="button" class="time-spin-btn" @click="stepFromS(1)"><ChevronUp class="w-3 h-3" /></button>
                  <span class="time-spin-val">{{ pad(fromS) }}</span>
                  <button type="button" class="time-spin-btn" @click="stepFromS(-1)"><ChevronDown class="w-3 h-3" /></button>
                </div>
              </div>
            </div>

            <!-- Arrow -->
            <div class="flex items-center self-center mt-4 text-gray-400 dark:text-gray-500 shrink-0">
              <ChevronRight class="w-4 h-4" />
            </div>

            <!-- To time -->
            <div class="flex-1">
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">To</div>
              <div class="flex items-center gap-0.5">
                <div class="flex flex-col items-center">
                  <button type="button" class="time-spin-btn" @click="stepToH(1)"><ChevronUp class="w-3 h-3" /></button>
                  <span class="time-spin-val">{{ pad(toH) }}</span>
                  <button type="button" class="time-spin-btn" @click="stepToH(-1)"><ChevronDown class="w-3 h-3" /></button>
                </div>
                <span class="time-sep">:</span>
                <div class="flex flex-col items-center">
                  <button type="button" class="time-spin-btn" @click="stepToM(1)"><ChevronUp class="w-3 h-3" /></button>
                  <span class="time-spin-val">{{ pad(toM) }}</span>
                  <button type="button" class="time-spin-btn" @click="stepToM(-1)"><ChevronDown class="w-3 h-3" /></button>
                </div>
                <span class="time-sep">:</span>
                <div class="flex flex-col items-center">
                  <button type="button" class="time-spin-btn" @click="stepToS(1)"><ChevronUp class="w-3 h-3" /></button>
                  <span class="time-spin-val">{{ pad(toS) }}</span>
                  <button type="button" class="time-spin-btn" @click="stepToS(-1)"><ChevronDown class="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 dark:border-gray-700 px-3 py-2 flex flex-col justify-between gap-2">
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ draftLabel }}</p>
          <div class="self-end flex items-center gap-2 shrink-0">
            <button type="button" class="btn-secondary btn-sm" @click="clearAll">Clear</button>
            <button type="button" class="btn-secondary btn-sm" @click="close">Cancel</button>
            <button type="button" class="btn-primary btn-sm" :disabled="!draftFrom" @click="apply">Apply</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.time-spin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: rgb(107 114 128);
  transition: background-color 0.15s, color 0.15s;
}

.time-spin-btn:hover {
  background-color: rgb(243 244 246);
  color: rgb(55 65 81);
}

:is(.dark .time-spin-btn) {
  color: rgb(156 163 175);
}

:is(.dark .time-spin-btn:hover) {
  background-color: rgb(55 65 81);
  color: rgb(229 231 235);
}

.time-spin-val {
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  color: rgb(17 24 39);
  width: 1.75rem;
  text-align: center;
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
}

:is(.dark .time-spin-val) {
  color: rgb(243 244 246);
}

.time-sep {
  color: rgb(156 163 175);
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.125rem;
}

:is(.dark .time-sep) {
  color: rgb(107 114 128);
}
</style>
