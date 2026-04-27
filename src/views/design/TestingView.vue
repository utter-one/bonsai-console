<script setup lang="ts">
import { ref } from 'vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import ScenariosList from '@/components/ScenariosList.vue'
import TestersList from '@/components/TestersList.vue'

type TabType = 'scenarios' | 'testers'

const activeTab = ref<TabType>('scenarios')

const tabs: TabDefinition[] = [
  { key: 'scenarios', label: 'Scenarios' },
  { key: 'testers', label: 'Testers' },
]
</script>

<template>
  <div class="container-constrained">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Testing</h1>
        <p class="page-subtitle">Manage test scenarios and testers for this project</p>
      </div>
    </div>

    <!-- Tabbed panel -->
    <div class="rounded-lg border border-gray-200 overflow-hidden dark:border-gray-700">
      <div class="tabs-container">
        <TabNavigator v-model="activeTab" :tabs="tabs" />
      </div>

      <div class="bg-white dark:bg-gray-800">
        <div v-show="activeTab === 'scenarios'" class="tab-content">
          <ScenariosList />
        </div>

        <div v-show="activeTab === 'testers'" class="tab-content">
          <TestersList />
        </div>
      </div>
    </div>
  </div>
</template>
