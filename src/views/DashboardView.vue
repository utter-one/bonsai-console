<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore, useUsersStore, useConversationsStore } from '@/stores'
import { BriefcaseBusiness, Users, MessageCircle, Activity, Settings } from 'lucide-vue-next'

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
  <div class="container-constrained mx-auto">
    <div class="mb-8">
      <h1 class="m-0 mb-2 text-4xl font-bold text-gray-900">Dashboard</h1>
      <p class="m-0 text-base text-gray-600">Welcome to Nexus Admin - Your AI Platform Management Console</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="spinner-container">
      <div class="spinner mb-4"></div>
      <p class="text-gray-700">Loading dashboard...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Stats Cards -->
      <div class="grid-stats mb-10">
        <div class="stat-card">
          <BriefcaseBusiness class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="stat-value">{{ stats.projects }}</div>
            <div class="stat-label">Projects</div>
          </div>
          <button @click="navigateTo('administration.projects')" class="btn-icon">
            View →
          </button>
        </div>

        <div class="stat-card">
          <Users class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="stat-value">{{ stats.users }}</div>
            <div class="stat-label">Users</div>
          </div>
          <button @click="navigateTo('monitor.users')" class="btn-icon">
            View →
          </button>
        </div>

        <div class="stat-card">
          <MessageCircle class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="stat-value">{{ stats.conversations }}</div>
            <div class="stat-label">Conversations</div>
          </div>
          <button @click="navigateTo('monitor.conversations')" class="btn-icon">
            View →
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section-card mb-6">
        <h2 class="section-title mb-5">Quick Actions</h2>
        <div class="grid-cards-sm">
          <button @click="navigateTo('administration.projects')" class="action-card">
            <BriefcaseBusiness class="text-primary-500" :size="32" />
            <span class="action-card-title">Projects</span>
            <span class="action-card-description">Create and configure AI projects</span>
          </button>

          <button @click="navigateTo('monitor.conversations')" class="action-card">
            <Activity class="text-primary-500" :size="32" />
            <span class="action-card-title">Monitor</span>
            <span class="action-card-description">Track conversations and issues</span>
          </button>

          <button @click="navigateTo('administration.admins')" class="action-card">
            <Settings class="text-primary-500" :size="32" />
            <span class="action-card-title">Administration</span>
            <span class="action-card-description">Manage system configuration</span>
          </button>
        </div>
      </div>

      <!-- Recent Projects -->
      <div class="section-card mb-6">
        <div class="section-header">
          <h2 class="section-title">Recent Projects</h2>
          <button @click="navigateTo('administration.projects')" class="btn-link">
            View All →
          </button>
        </div>
        
        <div v-if="projectsStore.items.length === 0" class="text-center py-10 px-5">
          <p class="m-0 mb-4 text-gray-600">No projects yet. Create your first project to get started!</p>
          <button @click="navigateTo('administration.projects')" class="btn-primary">
            Create Project
          </button>
        </div>

        <div v-else class="flex flex-col gap-3">
          <div v-for="project in projectsStore.items.slice(0, 5)" :key="project.id" class="list-item">
            <div>
              <h3 class="list-item-title">{{ project.name }}</h3>
              <p v-if="project.description" class="list-item-subtitle">{{ project.description }}</p>
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
