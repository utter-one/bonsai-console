<script setup lang="ts">
import { Construction } from 'lucide-vue-next'
import type { Component } from 'vue'

defineProps<{
  title: string
  description: string
  icon?: Component
  storeName?: string
}>()
</script>

<template>
  <div class="container-constrained mx-auto">
    <div class="mb-6">
      <div class="flex items-start gap-4">
        <component v-if="icon" :is="icon" class="text-primary-500 flex-shrink-0" :size="40" />
        <div>
          <h1 class="page-title">{{ title }}</h1>
          <p class="page-subtitle">{{ description }}</p>
        </div>
      </div>
    </div>
    
    <div class="construction-view">
      <div class="construction-content">
        <Construction class="text-orange-500 mb-5 mx-auto" :size="64" />
        <h2 class="construction-title">View Under Construction</h2>
        <p class="construction-text">This {{ title }} view is being built and will be available soon.</p>
        <p v-if="storeName" class="mt-5 p-3 bg-gray-100 rounded-md text-sm">
          Connected to: <code class="bg-gray-300 px-1.5 py-0.5 rounded font-mono">{{ storeName }}</code>
        </p>
      </div>
    </div>
  </div>
</template>
