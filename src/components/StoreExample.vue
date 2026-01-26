<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  useAuthStore, 
  useProjectsStore, 
  useUsersStore,
  useKnowledgeStore 
} from '@/stores'

// Initialize stores
const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const usersStore = useUsersStore()
const knowledgeStore = useKnowledgeStore()

// Login form
const loginForm = ref({
  id: 'admin@example.com',
  password: 'password123',
})

// Project form
const projectForm = ref({
  name: '',
  description: '',
})

// Active tab
const activeTab = ref<'projects' | 'users' | 'knowledge'>('projects')

// Computed
const isLoggedIn = computed(() => authStore.isAuthenticated)

// Methods
async function handleLogin() {
  try {
    await authStore.login(loginForm.value)
    await loadData()
  } catch (error) {
    console.error('Login failed:', error)
  }
}

function handleLogout() {
  authStore.logout()
}

async function loadData() {
  try {
    await Promise.all([
      projectsStore.fetchAll({ offset: 0, limit: 10 }),
      usersStore.fetchAll({ offset: 0, limit: 10 }),
      knowledgeStore.fetchSections(),
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

async function createProject() {
  if (!projectForm.value.name) return
  
  try {
    await projectsStore.create({
      name: projectForm.value.name,
      description: projectForm.value.description,
    })
    
    // Reset form
    projectForm.value.name = ''
    projectForm.value.description = ''
  } catch (error) {
    console.error('Failed to create project:', error)
  }
}

async function deleteProject(id: string) {
  if (!confirm('Are you sure you want to delete this project?')) return
  
  try {
    await projectsStore.remove(id)
  } catch (error) {
    console.error('Failed to delete project:', error)
  }
}

// Load data on mount if authenticated
onMounted(() => {
  if (isLoggedIn.value) {
    loadData()
  }
})
</script>

<template>
  <div class="nexus-admin-example">
    <!-- Header -->
    <header class="header">
      <h1>Nexus Admin - Pinia Store Example</h1>
      <div v-if="isLoggedIn" class="user-info">
        <span>{{ authStore.currentAdmin?.displayName }}</span>
        <button @click="handleLogout" class="btn btn-secondary">Logout</button>
      </div>
    </header>

    <!-- Login Form -->
    <div v-if="!isLoggedIn" class="login-container">
      <div class="login-form">
        <h2>Login</h2>
        
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>
        
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="id">Username/ID</label>
            <input 
              id="id"
              v-model="loginForm.id" 
              type="text" 
              required 
              placeholder="admin@example.com"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              id="password"
              v-model="loginForm.password" 
              type="password" 
              required 
              placeholder="Password"
            />
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="authStore.isLoading"
          >
            {{ authStore.isLoading ? 'Logging in...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="main-content">
      <!-- Tabs -->
      <div class="tabs">
        <button 
          :class="{ active: activeTab === 'projects' }"
          @click="activeTab = 'projects'"
        >
          Projects
        </button>
        <button 
          :class="{ active: activeTab === 'users' }"
          @click="activeTab = 'users'"
        >
          Users
        </button>
        <button 
          :class="{ active: activeTab === 'knowledge' }"
          @click="activeTab = 'knowledge'"
        >
          Knowledge Base
        </button>
      </div>

      <!-- Projects Tab -->
      <div v-if="activeTab === 'projects'" class="tab-content">
        <h2>Projects</h2>
        
        <!-- Create Project Form -->
        <div class="create-form">
          <h3>Create New Project</h3>
          <form @submit.prevent="createProject" class="inline-form">
            <input 
              v-model="projectForm.name" 
              type="text" 
              placeholder="Project name" 
              required
            />
            <input 
              v-model="projectForm.description" 
              type="text" 
              placeholder="Description"
            />
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="projectsStore.isLoading"
            >
              Create
            </button>
          </form>
        </div>
        
        <!-- Projects List -->
        <div v-if="projectsStore.isLoading" class="loading">
          Loading projects...
        </div>
        
        <div v-else-if="projectsStore.error" class="error-message">
          {{ projectsStore.error }}
        </div>
        
        <div v-else-if="projectsStore.items.length === 0" class="empty-state">
          No projects yet. Create one above!
        </div>
        
        <div v-else class="items-list">
          <div 
            v-for="project in projectsStore.items" 
            :key="project.id" 
            class="item-card"
          >
            <div class="item-header">
              <h4>{{ project.name }}</h4>
            </div>
            <p v-if="project.description">{{ project.description }}</p>
            <div class="item-meta">
              <span>Created: {{ new Date(project.createdAt).toLocaleDateString() }}</span>
            </div>
            <div class="item-actions">
              <button @click="deleteProject(project.id)" class="btn btn-danger btn-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
        
        <!-- Pagination Info -->
        <div v-if="projectsStore.items.length > 0" class="pagination-info">
          Showing {{ projectsStore.items.length }} of {{ projectsStore.pagination.total }} projects
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <h2>Users</h2>
        
        <div v-if="usersStore.isLoading" class="loading">
          Loading users...
        </div>
        
        <div v-else-if="usersStore.error" class="error-message">
          {{ usersStore.error }}
        </div>
        
        <div v-else-if="usersStore.items.length === 0" class="empty-state">
          No users found.
        </div>
        
        <div v-else class="items-list">
          <div 
            v-for="user in usersStore.items" 
            :key="user.id" 
            class="item-card"
          >
            <div class="item-header">
              <h4>{{ user.id }}</h4>
            </div>
            <p>Profile: {{ JSON.stringify(user.profile) }}</p>
            <div class="item-meta">
              <span v-if="user.createdAt">Created: {{ new Date(user.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Knowledge Base Tab -->
      <div v-if="activeTab === 'knowledge'" class="tab-content">
        <h2>Knowledge Base</h2>
        
        <div v-if="knowledgeStore.isLoading" class="loading">
          Loading knowledge sections...
        </div>
        
        <div v-else-if="knowledgeStore.error" class="error-message">
          {{ knowledgeStore.error }}
        </div>
        
        <div v-else-if="knowledgeStore.sections.length === 0" class="empty-state">
          No knowledge sections found.
        </div>
        
        <div v-else class="items-list">
          <div 
            v-for="section in knowledgeStore.sections" 
            :key="section.id" 
            class="item-card"
          >
            <div class="item-header">
              <h4>{{ section.name }}</h4>
              <span class="badge">Order: {{ section.order }}</span>
            </div>
            <p v-if="section.description">{{ section.description }}</p>
            <div class="item-meta">
              <span>Created: {{ new Date(section.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nexus-admin-example {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.login-form {
  width: 100%;
  max-width: 400px;
  padding: 30px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.login-form h2 {
  margin-top: 0;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.tabs button:hover {
  color: #333;
}

.tabs button.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
}

.create-form {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 30px;
}

.create-form h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.inline-form {
  display: flex;
  gap: 10px;
}

.inline-form input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.items-list {
  display: grid;
  gap: 15px;
}

.item-card {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.item-header h4 {
  margin: 0;
  color: #333;
}

.status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: #dc3545;
  color: white;
}

.status.active {
  background: #28a745;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: #007bff;
  color: white;
}

.item-meta {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}

.item-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error-message {
  padding: 15px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f5f5f5;
  border-radius: 8px;
}

.pagination-info {
  margin-top: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
}
</style>
