<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore, useUsersStore, useConversationsStore } from '@/stores'
import { Rocket, Users, MessageCircle, Palette, Activity, Search, Settings } from 'lucide-vue-next'

const router = useRouter()
const projectsStore = useProjectsStore()
const usersStore = useUsersStore()
const conversationsStore = useConversationsStore()

const isLoading = ref(true)

const stats = computed(() => ({
  projects: projectsStore.pagination.total,
  users: usersStore.pagination.total,
  conversations: conversationsStore.pagination.total,
}))

onMounted(async () => {
  try {
    await Promise.all([
      projectsStore.fetchAll({ offset: 0, limit: 10 }),
      usersStore.fetchAll({ offset: 0, limit: 1 }),
      conversationsStore.fetchAll({ offset: 0, limit: 1 }),
    ])
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    isLoading.value = false
  }
})

function navigateTo(route: string) {
  router.push({ name: route })
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto">
    <div class="mb-8">
      <h1 class="m-0 mb-2 text-4xl font-bold text-gray-900">Dashboard</h1>
      <p class="m-0 text-base text-gray-600">Welcome to Nexus Admin - Your AI Platform Management Console</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 px-5">
      <div class="w-10 h-10 border-4 border-gray-200 border-t-gradient-from rounded-full animate-spin mb-4"></div>
      <p class="text-gray-700">Loading dashboard...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Stats Cards -->
      <div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 mb-10">
        <div class="bg-white rounded-xl p-6 flex items-center gap-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Rocket class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="text-4xl font-bold text-gray-900 leading-none mb-1">{{ stats.projects }}</div>
            <div class="text-sm text-gray-600">Projects</div>
          </div>
          <button 
            @click="navigateTo('design.projects')" 
            class="px-4 py-2 border-none bg-blue-50 text-primary-500 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-100"
          >
            View →
          </button>
        </div>

        <div class="bg-white rounded-xl p-6 flex items-center gap-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Users class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="text-4xl font-bold text-gray-900 leading-none mb-1">{{ stats.users }}</div>
            <div class="text-sm text-gray-600">Users</div>
          </div>
          <button 
            @click="navigateTo('monitor.users')" 
            class="px-4 py-2 border-none bg-blue-50 text-primary-500 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-100"
          >
            View →
          </button>
        </div>

        <div class="bg-white rounded-xl p-6 flex items-center gap-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <MessageCircle class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="text-4xl font-bold text-gray-900 leading-none mb-1">{{ stats.conversations }}</div>
            <div class="text-sm text-gray-600">Conversations</div>
          </div>
          <button 
            @click="navigateTo('monitor.conversations')" 
            class="px-4 py-2 border-none bg-blue-50 text-primary-500 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-100"
          >
            View →
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <h2 class="m-0 mb-5 text-xl font-semibold text-gray-900">Quick Actions</h2>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <button 
            @click="navigateTo('design.projects')" 
            class="flex flex-col items-start gap-2 p-5 border-2 border-gray-200 rounded-lg bg-white cursor-pointer transition-all text-left hover:border-primary-500 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(25,118,210,0.15)]"
          >
            <Palette class="text-primary-500" :size="32" />
            <span class="text-base font-semibold text-gray-900">Design</span>
            <span class="text-sm text-gray-600">Create and configure AI projects</span>
          </button>

          <button 
            @click="navigateTo('monitor.conversations')" 
            class="flex flex-col items-start gap-2 p-5 border-2 border-gray-200 rounded-lg bg-white cursor-pointer transition-all text-left hover:border-primary-500 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(25,118,210,0.15)]"
          >
            <Activity class="text-primary-500" :size="32" />
            <span class="text-base font-semibold text-gray-900">Monitor</span>
            <span class="text-sm text-gray-600">Track conversations and issues</span>
          </button>

          <button 
            @click="navigateTo('analyze.conversations')" 
            class="flex flex-col items-start gap-2 p-5 border-2 border-gray-200 rounded-lg bg-white cursor-pointer transition-all text-left hover:border-primary-500 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(25,118,210,0.15)]"
          >
            <Search class="text-primary-500" :size="32" />
            <span class="text-base font-semibold text-gray-900">Analyze</span>
            <span class="text-sm text-gray-600">Review performance metrics</span>
          </button>

          <button 
            @click="navigateTo('administration.admins')" 
            class="flex flex-col items-start gap-2 p-5 border-2 border-gray-200 rounded-lg bg-white cursor-pointer transition-all text-left hover:border-primary-500 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(25,118,210,0.15)]"
          >
            <Settings class="text-primary-500" :size="32" />
            <span class="text-base font-semibold text-gray-900">Administration</span>
            <span class="text-sm text-gray-600">Manage system configuration</span>
          </button>
        </div>
      </div>

      <!-- Recent Projects -->
      <div class="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div class="flex justify-between items-center mb-5">
          <h2 class="m-0 text-xl font-semibold text-gray-900">Recent Projects</h2>
          <button 
            @click="navigateTo('design.projects')" 
            class="px-4 py-2 border-none bg-transparent text-primary-500 text-sm font-medium cursor-pointer transition-colors hover:text-primary-600"
          >
            View All →
          </button>
        </div>
        
        <div v-if="projectsStore.items.length === 0" class="text-center py-10 px-5">
          <p class="m-0 mb-4 text-gray-600">No projects yet. Create your first project to get started!</p>
          <button 
            @click="navigateTo('design.projects')" 
            class="px-5 py-2.5 border-none bg-primary-500 text-white rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-600"
          >
            Create Project
          </button>
        </div>

        <div v-else class="flex flex-col gap-3">
          <div 
            v-for="project in projectsStore.items.slice(0, 5)" 
            :key="project.id" 
            class="flex justify-between items-center p-4 border border-gray-200 rounded-lg transition-all hover:border-primary-500 hover:bg-gray-50"
          >
            <div>
              <h3 class="m-0 mb-1 text-base font-semibold text-gray-900">{{ project.name }}</h3>
              <p v-if="project.description" class="m-0 text-sm text-gray-600">{{ project.description }}</p>
            </div>
            <span class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-primary-500">
              v{{ project.version }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
