<script setup lang="ts">
import { computed, watchEffect, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores'
import type { Component } from 'vue'

interface MenuItem {
  name: string
  label: string
  icon?: Component
}

interface Props {
  title: string
  menuItems: MenuItem[]
}

const props = defineProps<Props>()
const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()

const currentRouteName = computed(() => route.name as string)

// Generate a unique ID for this instance
const ownerId = Math.random().toString(36).substring(7)

// Update store when props change
watchEffect(() => {
  layoutStore.setSidebar(props.title, props.menuItems, ownerId)
})

// Clear store on unmount
onUnmounted(() => {
  layoutStore.clearSidebar(ownerId)
})

function navigateTo(routeName: string) {
  router.push({ name: routeName })
}
</script>

<template>
  <div class="md:flex gap-6 h-full ">
    <!-- Sidebar Navigation -->
    <aside class="w-64 flex-shrink-0 hidden md:block">
      <div class="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-24 dark:bg-gray-800 dark:border-gray-700">
        <div class="px-4 py-4 border-b border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h2>
        </div>
        <nav class="p-2">
          <button
            v-for="item in menuItems"
            :key="item.name"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 border-none bg-transparent text-left text-sm font-medium rounded-md cursor-pointer transition-all',
              currentRouteName === item.name
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
            @click="navigateTo(item.name)"
          >
            <component v-if="item.icon" :is="item.icon" :size="18" class="flex-shrink-0" />
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 min-w-0">
      <slot />
    </main>
  </div>
</template>
