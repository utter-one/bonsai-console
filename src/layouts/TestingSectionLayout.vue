<script setup lang="ts">
import { computed, watchEffect, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectSelectionStore, useLayoutStore } from '@/stores'
import { FlaskConical, Bot, ClipboardList } from 'lucide-vue-next'
import AppVersion from '@/components/AppVersion.vue'

const route = useRoute()
const router = useRouter()
const projectSelectionStore = useProjectSelectionStore()
const layoutStore = useLayoutStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const ownerId = Math.random().toString(36).substring(7)

watchEffect(() => {
  layoutStore.setSidebar('Testing', [
    { name: 'testing.playground', label: 'Playground', icon: FlaskConical },
    { name: '__divider__', label: '', divider: true },
    { name: 'testing.testers', label: 'Testers', icon: Bot },
    { name: 'testing.scenarios', label: 'Scenarios', icon: ClipboardList },
  ], ownerId)
})

onUnmounted(() => {
  layoutStore.clearSidebar(ownerId)
})

function navigateTo(routeName: string) {
  if (routeName === 'testing.playground') {
    if (projectId.value) {
      router.push({ name: 'testing.playground', params: { projectId: projectId.value } })
    } else {
      router.push({ name: 'testing.playground' })
    }
  } else if (projectId.value) {
    router.push({ name: routeName, params: { projectId: projectId.value } })
  }
}

function isActive(routeName: string): boolean {
  return route.matched.some(r => r.name === routeName)
}

const activeClass = 'bg-primary-50 text-primary-500 dark:bg-primary-900/20 dark:text-primary-400'
const inactiveClass = 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
const disabledClass = 'opacity-40 cursor-not-allowed text-gray-700 dark:text-gray-300'
</script>

<template>
  <div class="md:flex gap-6 h-full">
    <!-- Sidebar Navigation -->
    <aside class="w-64 flex-shrink-0 hidden md:block">
      <div class="bg-white rounded-lg border border-gray-200 overflow-hidden sticky dark:bg-gray-800 dark:border-gray-700">
        <div class="px-4 py-4 border-b border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">Testing</h2>
        </div>
        <nav class="p-2">
          <button
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 border-none text-left text-sm font-medium rounded-md cursor-pointer transition-all',
              isActive('testing.playground') ? activeClass : inactiveClass,
            ]"
            @click="navigateTo('testing.playground')"
          >
            <FlaskConical :size="18" class="flex-shrink-0" />
            <span>Playground</span>
          </button>

          <hr class="my-2 border-gray-200 dark:border-gray-700" />

          <button
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 border-none text-left text-sm font-medium rounded-md transition-all',
              !projectId ? disabledClass : isActive('testing.testers') ? activeClass : inactiveClass,
              !projectId ? '' : 'cursor-pointer',
            ]"
            :disabled="!projectId"
            @click="navigateTo('testing.testers')"
          >
            <Bot :size="18" class="flex-shrink-0" />
            <span>Testers</span>
          </button>

          <button
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 border-none text-left text-sm font-medium rounded-md transition-all',
              !projectId ? disabledClass : isActive('testing.scenarios') ? activeClass : inactiveClass,
              !projectId ? '' : 'cursor-pointer',
            ]"
            :disabled="!projectId"
            @click="navigateTo('testing.scenarios')"
          >
            <ClipboardList :size="18" class="flex-shrink-0" />
            <span>Scenarios</span>
          </button>
        </nav>
      </div>
      <AppVersion />
    </aside>

    <!-- Main Content -->
    <main class="flex-1 min-w-0">
      <slot />
    </main>
  </div>
</template>
