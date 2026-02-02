<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore, useUsersStore, useConversationsStore, useStagesStore, usePersonasStore, useProvidersStore } from '@/stores'
import { BriefcaseBusiness, User, MessageSquare, Settings, Zap, RefreshCw, Drama, CloudCog } from 'lucide-vue-next'

const router = useRouter()
const projectsStore = useProjectsStore()
const usersStore = useUsersStore()
const conversationsStore = useConversationsStore()
const stagesStore = useStagesStore()
const personasStore = usePersonasStore()
const providersStore = useProvidersStore()

const isLoading = ref(true)

const stats = computed(() => ({
  projects: projectsStore.pagination.total,
  users: usersStore.pagination.total,
  conversations: conversationsStore.pagination.total,
  events: conversationsStore.pagination.total * 2.5, // Approximate events based on conversations
  stages: stagesStore.pagination.total,
  personas: personasStore.pagination.total,
}))

onMounted(async () => {
  try {
    await Promise.all([
      projectsStore.fetchAll({ offset: 0, limit: 10 }),
      usersStore.fetchAll({ offset: 0, limit: 1 }),
      conversationsStore.fetchAll({ offset: 0, limit: 1 }),
      stagesStore.fetchAll({ offset: 0, limit: 1 }),
      personasStore.fetchAll({ offset: 0, limit: 1 }),
      providersStore.fetchAll({ offset: 0, limit: 1 }),
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

function navigateToDesign(projectId: string) {
  router.push({ name: 'design.stages', params: { projectId } })
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
        </div>

        <div class="stat-card">
          <User class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="stat-value">{{ stats.users }}</div>
            <div class="stat-label">Users</div>
          </div>
        </div>

        <div class="stat-card">
          <MessageSquare class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="stat-value">{{ stats.conversations }}</div>
            <div class="stat-label">Conversations</div>
          </div>
        </div>

        <div class="stat-card">
          <Zap class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="stat-value">{{ Math.round(stats.events) }}</div>
            <div class="stat-label">Events</div>
          </div>
        </div>

        <div class="stat-card">
          <RefreshCw class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="stat-value">{{ stats.stages }}</div>
            <div class="stat-label">Stages</div>
          </div>
        </div>

        <div class="stat-card">
          <Drama class="text-primary-500 flex-shrink-0" :size="36" />
          <div class="flex-1">
            <div class="stat-value">{{ stats.personas }}</div>
            <div class="stat-label">Personas</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section-card mb-6">
        <h2 class="section-title pb-4">Quick Actions</h2>
        <div class="grid-cards-sm">
          <button @click="navigateTo('administration.projects')" class="action-card">
            <BriefcaseBusiness class="text-primary-500" :size="32" />
            <span class="action-card-title">Projects</span>
            <span class="action-card-description">Create and configure AI projects</span>
          </button>

          <button @click="navigateTo('administration.providers')" class="action-card">
            <CloudCog class="text-primary-500" :size="32" />
            <span class="action-card-title">Providers</span>
            <span class="action-card-description">Manage LLM providers and models</span>
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
          <button 
            v-for="project in projectsStore.items.slice(0, 5)" 
            :key="project.id" 
            @click="navigateToDesign(project.id)"
            class="list-item cursor-pointer hover:bg-gray-50 transition-colors text-left w-full"
          >
            <div>
              <h3 class="list-item-title">{{ project.name }}</h3>
              <p v-if="project.description" class="list-item-subtitle">{{ project.description }}</p>
            </div>
            <span class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-primary-500">
              v{{ project.version }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
