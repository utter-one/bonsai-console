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
  <div class="placeholder-view">
    <div class="placeholder-header">
      <div class="header-content">
        <component v-if="icon" :is="icon" class="view-icon" :size="40" />
        <div>
          <h1>{{ title }}</h1>
          <p>{{ description }}</p>
        </div>
      </div>
    </div>
    
    <div class="placeholder-content">
      <div class="coming-soon">
        <Construction class="icon" :size="64" />
        <h2>View Under Construction</h2>
        <p>This {{ title }} view is being built and will be available soon.</p>
        <p v-if="storeName" class="store-info">
          Connected to: <code>{{ storeName }}</code>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.placeholder-view {
  max-width: 1400px;
  margin: 0 auto;
}

.placeholder-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.view-icon {
  color: #1976d2;
  flex-shrink: 0;
}

.placeholder-header h1 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
}

.placeholder-header p {
  margin: 0;
  color: #666;
}

.placeholder-content {
  background: white;
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 60px 20px;
}

.coming-soon {
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.coming-soon .icon {
  color: #ff9800;
  margin-bottom: 20px;
}

.coming-soon h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  color: #1a1a1a;
}

.coming-soon p {
  margin: 0 0 8px 0;
  color: #666;
  line-height: 1.6;
}

.store-info {
  margin-top: 20px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 14px;
}

.store-info code {
  background: #e0e0e0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}
</style>
