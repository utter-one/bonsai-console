<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { Moon, Sun } from 'lucide-vue-next'

const themeStore = useThemeStore()
</script>

<template>
  <button
    @click="themeStore.toggleTheme"
    class="p-2 rounded-full border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-yellow-400"
    :title="themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
  >
    <Sun v-if="themeStore.isDark" :size="20" />
    <Moon v-else :size="20" />
  </button>
</template>
