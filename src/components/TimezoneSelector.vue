<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useTimezonesStore } from '@/stores'
import { Globe, ChevronDown } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  /** The selected IANA timezone string. Empty string means "use default / no override". */
  modelValue: string
  /**
   * Label shown when nothing is selected (empty string value) and as the first option in the list.
   * @default 'UTC (default)'
   */
  placeholder?: string
  disabled?: boolean
  /**
   * 'button' — compact btn-secondary trigger suitable for toolbars/headers.
   * 'form'   — full-width form-select-like trigger suitable for form fields.
   */
  variant?: 'button' | 'form'
  /** Show a globe icon in the trigger (useful for toolbar buttons). */
  showIcon?: boolean
}>(), {
  placeholder: 'UTC (default)',
  disabled: false,
  variant: 'button',
  showIcon: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const timezonesStore = useTimezonesStore()

const isOpen = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const dropdownStyle = ref<{ top: string; left: string; width?: string; minWidth?: string }>({
  top: '0px',
  left: '0px',
})

const filteredTimezones = computed(() => timezonesStore.search(searchQuery.value))

const displayLabel = computed(() => props.modelValue || props.placeholder)

function updateDropdownPosition() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    top: `${rect.bottom + window.scrollY + 4}px`,
    left: `${rect.left + window.scrollX}px`,
    ...(props.variant === 'form'
      ? { width: `${rect.width}px` }
      : { minWidth: '280px' }),
  }
}

function open() {
  if (props.disabled) return
  updateDropdownPosition()
  isOpen.value = true
  searchQuery.value = ''
  nextTick(() => searchInputRef.value?.focus())
}

function close() {
  isOpen.value = false
}

function toggle() {
  isOpen.value ? close() : open()
}

function select(tz: string) {
  emit('update:modelValue', tz)
  close()
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('scroll', updateDropdownPosition, true)
  window.addEventListener('resize', updateDropdownPosition)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
})
</script>

<template>
  <div
    ref="containerRef"
    :class="variant === 'form' ? 'relative block' : 'relative inline-flex'"
  >
    <!-- Trigger: button variant -->
    <button
      v-if="variant === 'button'"
      type="button"
      class="btn-secondary flex items-center gap-2 whitespace-nowrap"
      :disabled="disabled"
      @click="toggle"
    >
      <Globe v-if="showIcon" :size="18" />
      <span class="hidden md:inline">{{ displayLabel }}</span>
      <ChevronDown :size="16" class="ml-1 text-gray-500" />
    </button>

    <!-- Trigger: form variant -->
    <button
      v-else
      type="button"
      class="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      :disabled="disabled"
      @click="toggle"
    >
      <span :class="modelValue ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-400'">
        {{ displayLabel }}
      </span>
      <ChevronDown :size="16" class="text-gray-400 flex-shrink-0 ml-2" />
    </button>

    <!-- Dropdown -->
    <Teleport to="body">
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700"
        :style="dropdownStyle"
        @click.stop
        @mousedown.stop
      >
        <!-- Search -->
        <div class="p-2 border-b border-gray-100 dark:border-gray-700">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search timezones..."
            class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <!-- List -->
        <div class="max-h-[260px] overflow-y-auto">
          <!-- Default / no-selection option -->
          <button
            type="button"
            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
            :class="{ 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': modelValue === '' }"
            @click="select('')"
          >
            {{ placeholder }}
          </button>
          <div class="h-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

          <!-- Timezone options -->
          <button
            v-for="tz in filteredTimezones"
            :key="tz"
            type="button"
            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
            :class="{ 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': tz === modelValue }"
            @click="select(tz)"
          >
            {{ tz }}
          </button>

          <!-- Empty state -->
          <div v-if="filteredTimezones.length === 0" class="px-4 py-3 text-sm text-gray-500 italic dark:text-gray-400">
            No timezones found
          </div>
        </div>
      </div>
    </Transition>
    </Teleport>
  </div>
</template>
