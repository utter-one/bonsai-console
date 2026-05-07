<script setup lang="ts">
import { watchEffect, onUnmounted } from 'vue'
import { useLayoutStore } from '@/stores'
import type { Component } from 'vue'

interface MenuItem {
  name: string
  label: string
  icon?: Component
  experimental?: boolean
  divider?: boolean
}

interface Props {
  title: string
  menuItems: MenuItem[]
}

const props = defineProps<Props>()
const layoutStore = useLayoutStore()

const ownerId = Math.random().toString(36).substring(7)

watchEffect(() => {
  layoutStore.setSidebar(props.title, props.menuItems, ownerId)
})

onUnmounted(() => {
  layoutStore.clearSidebar(ownerId)
})
</script>

<template>
  <div class="flex-1 min-w-0">
    <slot />
  </div>
</template>
