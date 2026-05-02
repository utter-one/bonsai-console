<script setup lang="ts">
import { computed } from 'vue'
import { useProjectSelectionStore } from '@/stores'
import { BarChart2 } from 'lucide-vue-next'
import { RouterView, useRoute } from 'vue-router'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'

const projectSelectionStore = useProjectSelectionStore()
const route = useRoute()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
</script>

<template>
  <MonitorSectionLayout>
    <div class="container-constrained">
      <div class="page-header">
        <div>
          <h1 class="page-title">Analytics</h1>
          <p class="page-subtitle">Performance and usage statistics for your project</p>
        </div>
      </div>

      <div v-if="!projectId" class="empty-state">
        <BarChart2 class="empty-state-icon" />
        <p class="empty-state-title">No project selected</p>
        <p>Select a project to view analytics</p>
      </div>

      <template v-else>
         <nav class="tabs-nav mb-6 border-b border-gray-200 dark:border-gray-700">
          <router-link
            :to="{ name: 'monitor.analytics.latency' }"
            class="tab-button"
            :class="{ 'tab-button-active': route.name === 'monitor.analytics.latency' }"
          >
            Latency Analysis
          </router-link>
          <router-link
            :to="{ name: 'monitor.analytics.tokenUsage' }"
            class="tab-button"
            :class="{ 'tab-button-active': route.name === 'monitor.analytics.tokenUsage' }"
          >
            Token Usage
          </router-link>
          <router-link
            :to="{ name: 'monitor.analytics.explore' }"
            class="tab-button"
            :class="{ 'tab-button-active': route.name === 'monitor.analytics.explore' }"
          >
            Explorer
          </router-link>
          <router-link
            :to="{ name: 'monitor.analytics.funnels' }"
            class="tab-button"
            :class="{ 'tab-button-active': route.name === 'monitor.analytics.funnels' }"
          >
            Funnels
          </router-link>
        </nav>

        <RouterView />
      </template>
    </div>
  </MonitorSectionLayout>
</template>
