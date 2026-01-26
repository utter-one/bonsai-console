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
  <div class="max-w-[1400px] mx-auto">
    <div class="mb-6">
      <div class="flex items-start gap-4">
        <component v-if="icon" :is="icon" class="text-primary-500 flex-shrink-0" :size="40" />
        <div>
          <h1 class="m-0 mb-1 text-3xl font-bold text-gray-900">{{ title }}</h1>
          <p class="m-0 text-gray-600">{{ description }}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white border-2 border-dashed border-gray-200 rounded-xl py-16 px-5">
      <div class="text-center max-w-[500px] mx-auto">
        <Construction class="text-orange-500 mb-5 mx-auto" :size="64" />
        <h2 class="m-0 mb-3 text-2xl text-gray-900">View Under Construction</h2>
        <p class="m-0 mb-2 text-gray-600 leading-relaxed">This {{ title }} view is being built and will be available soon.</p>
        <p v-if="storeName" class="mt-5 p-3 bg-gray-100 rounded-md text-sm">
          Connected to: <code class="bg-gray-300 px-1.5 py-0.5 rounded font-mono">{{ storeName }}</code>
        </p>
      </div>
    </div>
  </div>
</template>
