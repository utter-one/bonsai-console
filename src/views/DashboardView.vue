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
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome to Nexus Admin - Your AI Platform Management Console</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading dashboard...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <Rocket class="stat-icon" :size="36" />
          <div class="stat-content">
            <div class="stat-value">{{ stats.projects }}</div>
            <div class="stat-label">Projects</div>
          </div>
          <button @click="navigateTo('design.projects')" class="stat-action">View →</button>
        </div>

        <div class="stat-card">
          <Users class="stat-icon" :size="36" />
          <div class="stat-content">
            <div class="stat-value">{{ stats.users }}</div>
            <div class="stat-label">Users</div>
          </div>
          <button @click="navigateTo('monitor.users')" class="stat-action">View →</button>
        </div>

        <div class="stat-card">
          <MessageCircle class="stat-icon" :size="36" />
          <div class="stat-content">
            <div class="stat-value">{{ stats.conversations }}</div>
            <div class="stat-label">Conversations</div>
          </div>
          <button @click="navigateTo('monitor.conversations')" class="stat-action">View →</button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <button @click="navigateTo('design.projects')" class="action-card">
            <Palette class="action-icon" :size="32" />
            <span class="action-title">Design</span>
            <span class="action-desc">Create and configure AI projects</span>
          </button>

          <button @click="navigateTo('monitor.conversations')" class="action-card">
            <Activity class="action-icon" :size="32" />
            <span class="action-title">Monitor</span>
            <span class="action-desc">Track conversations and issues</span>
          </button>

          <button @click="navigateTo('analyze.conversations')" class="action-card">
            <Search class="action-icon" :size="32" />
            <span class="action-title">Analyze</span>
            <span class="action-desc">Review performance metrics</span>
          </button>

          <button @click="navigateTo('settings.admins')" class="action-card">
            <Settings class="action-icon" :size="32" />
            <span class="action-title">Settings</span>
            <span class="action-desc">Manage system configuration</span>
          </button>
        </div>
      </div>

      <!-- Recent Projects -->
      <div class="section">
        <div class="section-header">
          <h2>Recent Projects</h2>
          <button @click="navigateTo('design.projects')" class="view-all-btn">View All →</button>
        </div>
        
        <div v-if="projectsStore.items.length === 0" class="empty-state">
          <p>No projects yet. Create your first project to get started!</p>
          <button @click="navigateTo('design.projects')" class="create-btn">Create Project</button>
        </div>

        <div v-else class="projects-list">
          <div v-for="project in projectsStore.items.slice(0, 5)" :key="project.id" class="project-item">
            <div class="project-info">
              <h3>{{ project.name }}</h3>
              <p v-if="project.description">{{ project.description }}</p>
            </div>
            <span class="project-meta">v{{ project.version }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 32px;
}

.dashboard-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
}

.dashboard-header p {
  margin: 0;
  font-size: 16px;
  color: #666;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  color: #1976d2;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-action {
  padding: 8px 16px;
  border: none;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.stat-action:hover {
  background: #bbdefb;
}

/* Sections */
.section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
}

.view-all-btn {
  padding: 8px 16px;
  border: none;
  background: none;
  color: #1976d2;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.view-all-btn:hover {
  color: #1565c0;
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.action-card:hover {
  border-color: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
}

.action-icon {
  color: #1976d2;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.action-desc {
  font-size: 13px;
  color: #666;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-state p {
  margin: 0 0 16px 0;
  color: #666;
}

.create-btn {
  padding: 10px 20px;
  border: none;
  background: #1976d2;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.create-btn:hover {
  background: #1565c0;
}

/* Projects List */
.projects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
}

.project-item:hover {
  border-color: #1976d2;
  background: #fafafa;
}

.project-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.project-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.project-meta {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: #e3f2fd;
  color: #1976d2;
}

@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
