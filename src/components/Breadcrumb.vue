<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, Star } from 'lucide-vue-next'

interface BreadcrumbItem {
  label: string
  to?: string
  id?: string
}

const props = defineProps<{
  items?: BreadcrumbItem[]
  title?: string
  showFavorite?: boolean
}>()

const route = useRoute()
const router = useRouter()

const breadcrumbs = computed(() => {
  if (props.items) return props.items

  const matched = route.matched.filter(r => r.meta.title)
  return matched.map(r => ({
    label: String(r.meta.title),
    to: r.path,
  }))
})

function navigateTo(path?: string) {
  if (path) {
    router.push({ path })
  }
}

const isFavorite = ref(false)

function toggleFavorite() {
  isFavorite.value = !isFavorite.value
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Breadcrumb Trail -->
    <nav class="flex items-center gap-1.5 text-xs">
      <button
        class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors cursor-pointer"
        @click="router.push({ name: 'dashboard' })"
      >
        Home
      </button>
      <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
        <ChevronRight :size="12" class="text-gray-300 dark:text-gray-600" />
        <button
          v-if="crumb.to && idx < breadcrumbs.length - 1"
          class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors cursor-pointer"
          @click="navigateTo(crumb.to)"
        >
          {{ crumb.label }}
        </button>
        <span
          v-else
          class="text-gray-500 dark:text-gray-400"
        >
          {{ crumb.label }}
        </span>
      </template>
    </nav>

    <!-- Title Row -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3 min-w-0">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white truncate">
          {{ title || breadcrumbs[breadcrumbs.length - 1]?.label }}
        </h1>
        <span
          v-if="title && (breadcrumbs[breadcrumbs.length - 1] as any)?.id"
          class="text-xs font-mono text-gray-400 dark:text-gray-500 flex-shrink-0"
        >
          {{ (breadcrumbs[breadcrumbs.length - 1] as any).id }}
        </span>
      </div>

      <div v-if="showFavorite" class="flex-shrink-0">
        <button
          class="p-1.5 rounded-md border-none bg-transparent cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          :class="isFavorite ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'"
          @click="toggleFavorite"
        >
          <Star :size="18" :class="isFavorite ? 'fill-amber-400' : ''" />
        </button>
      </div>
    </div>

    <!-- Metadata Row -->
    <div class="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
      <slot name="metadata" />
    </div>
  </div>
</template>
