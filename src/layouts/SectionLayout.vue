<script setup lang="ts">
import { computed, watchEffect, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores'
import type { Component } from 'vue'

interface MenuItem {
  name: string
  label: string
  icon?: Component
  params?: Record<string, string>
  children?: MenuItem[]
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

function navigateTo(item: MenuItem) {
  router.push({ name: item.name, params: item.params })
}

function isItemActive(item: MenuItem): boolean {
  if (currentRouteName.value === item.name) return true
  if (item.children?.some(child => isChildActive(child))) return true
  return false
}

function isChildActive(child: MenuItem): boolean {
  if (currentRouteName.value !== child.name) return false
  if (!child.params) return true
  return Object.entries(child.params).every(([key, val]) => route.params[key] === val)
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
          <template v-for="item in menuItems" :key="item.name">
            <button
              :class="[
                'w-full flex items-center gap-3 px-3 py-2.5 border-none bg-transparent text-left text-sm font-medium rounded-md cursor-pointer transition-all',
                isItemActive(item)
                  ? 'bg-primary-50 text-primary-500 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              ]"
              @click="navigateTo(item)"
            >
              <component v-if="item.icon" :is="item.icon" :size="18" class="flex-shrink-0" />
              <span>{{ item.label }}</span>
            </button>

            <!-- Sub-items -->
            <div v-if="item.children && item.children.length > 0" class="ml-4 mt-0.5 mb-1">
              <button
                v-for="child in item.children"
                :key="child.name + JSON.stringify(child.params)"
                :class="[
                  'w-full flex items-center gap-2 px-3 py-2 border-none bg-transparent text-left text-xs font-medium rounded-md cursor-pointer transition-all border-l-2',
                  isChildActive(child)
                    ? 'border-primary-400 bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-500'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                ]"
                @click.stop="navigateTo(child)"
              >
                <component v-if="child.icon" :is="child.icon" :size="14" class="flex-shrink-0" />
                <span class="truncate">{{ child.label }}</span>
              </button>
            </div>
          </template>
        </nav>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 min-w-0">
      <slot />
    </main>
  </div>
</template>

