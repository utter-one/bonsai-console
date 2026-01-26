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
  <div class="max-w-6xl mx-auto p-5">
    <!-- Header -->
    <header class="flex justify-between items-center py-5 border-b-2 border-gray-200 mb-8">
      <h1 class="m-0 text-gray-900">Nexus Admin - Pinia Store Example</h1>
      <div v-if="isLoggedIn" class="flex items-center gap-4">
        <span>{{ authStore.currentAdmin?.displayName }}</span>
        <button @click="handleLogout" class="px-5 py-2.5 border-none rounded bg-gray-600 text-white text-sm cursor-pointer transition-all hover:bg-gray-700">Logout</button>
      </div>
    </header>

    <!-- Login Form -->
    <div v-if="!isLoggedIn" class="flex justify-center items-center min-h-[400px]">
      <div class="w-full max-w-md p-8 border border-gray-200 rounded-lg shadow-md">
        <h2 class="mt-0 mb-5">Login</h2>
        
        <div v-if="authStore.error" class="p-4 mb-5 bg-red-100 text-red-800 border border-red-300 rounded">
          {{ authStore.error }}
        </div>
        
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="id" class="block mb-1 font-medium text-gray-700">Username/ID</label>
            <input 
              id="id"
              v-model="loginForm.id" 
              type="text" 
              required 
              placeholder="admin@example.com"
              class="w-full px-2.5 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          
          <div class="mb-4">
            <label for="password" class="block mb-1 font-medium text-gray-700">Password</label>
            <input 
              id="password"
              v-model="loginForm.password" 
              type="password" 
              required 
              placeholder="Password"
              class="w-full px-2.5 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          
          <button 
            type="submit" 
            class="px-5 py-2.5 border-none rounded bg-blue-600 text-white text-sm cursor-pointer transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div class="flex gap-2.5 mb-5 border-b-2 border-gray-200">
        <button 
          :class="['px-5 py-2.5 border-none bg-transparent cursor-pointer text-base text-gray-600 border-b-[3px] border-transparent transition-all hover:text-gray-900', activeTab === 'projects' && 'text-blue-600 border-blue-600']"
          @click="activeTab = 'projects'"
        >
          Projects
        </button>
        <button 
          :class="['px-5 py-2.5 border-none bg-transparent cursor-pointer text-base text-gray-600 border-b-[3px] border-transparent transition-all hover:text-gray-900', activeTab === 'users' && 'text-blue-600 border-blue-600']"
          @click="activeTab = 'users'"
        >
          Users
        </button>
        <button 
          :class="['px-5 py-2.5 border-none bg-transparent cursor-pointer text-base text-gray-600 border-b-[3px] border-transparent transition-all hover:text-gray-900', activeTab === 'knowledge' && 'text-blue-600 border-blue-600']"
          @click="activeTab = 'knowledge'"
        >
          Knowledge Base
        </button>
      </div>

      <!-- Projects Tab -->
      <div v-if="activeTab === 'projects'" class="tab-content">
        <h2 class="mt-0 mb-5">Projects</h2>
        
        <!-- Create Project Form -->
        <div class="p-5 bg-gray-100 rounded-lg mb-8">
          <h3 class="mt-0 mb-4">Create New Project</h3>
          <form @submit.prevent="createProject" class="flex gap-2.5">
            <input 
              v-model="projectForm.name" 
              type="text" 
              placeholder="Project name" 
              required
              class="flex-1 px-2.5 py-2 border border-gray-300 rounded"
            />
            <input 
              v-model="projectForm.description" 
              type="text" 
              placeholder="Description"
              class="flex-1 px-2.5 py-2 border border-gray-300 rounded"
            />
            <button 
              type="submit" 
              class="px-5 py-2.5 border-none rounded bg-blue-600 text-white text-sm cursor-pointer transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="projectsStore.isLoading"
            >
              Create
            </button>
          </form>
        </div>
        
        <!-- Projects List -->
        <div v-if="projectsStore.isLoading" class="text-center py-10 text-gray-600">
          Loading projects...
        </div>
        
        <div v-else-if="projectsStore.error" class="p-4 bg-red-100 text-red-800 border border-red-300 rounded mb-5">
          {{ projectsStore.error }}
        </div>
        
        <div v-else-if="projectsStore.items.length === 0" class="text-center py-10 text-gray-600 bg-gray-100 rounded-lg">
          No projects yet. Create one above!
        </div>
        
        <div v-else class="grid gap-4">
          <div 
            v-for="project in projectsStore.items" 
            :key="project.id" 
            class="p-5 border border-gray-200 rounded-lg bg-white"
          >
            <div class="flex justify-between items-center mb-2.5">
              <h4 class="m-0 text-gray-900">{{ project.name }}</h4>
            </div>
            <p v-if="project.description" class="mb-2.5">{{ project.description }}</p>
            <div class="mt-2.5 text-xs text-gray-600">
              <span>Created: {{ new Date(project.createdAt).toLocaleDateString() }}</span>
            </div>
            <div class="mt-4 flex gap-2.5">
              <button @click="deleteProject(project.id)" class="px-2.5 py-1.5 text-xs border-none rounded bg-red-600 text-white cursor-pointer transition-all hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
        
        <!-- Pagination Info -->
        <div v-if="projectsStore.items.length > 0" class="mt-5 text-center text-gray-600 text-sm">
          Showing {{ projectsStore.items.length }} of {{ projectsStore.pagination.total }} projects
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <h2 class="mt-0 mb-5">Users</h2>
        
        <div v-if="usersStore.isLoading" class="text-center py-10 text-gray-600">
          Loading users...
        </div>
        
        <div v-else-if="usersStore.error" class="p-4 bg-red-100 text-red-800 border border-red-300 rounded mb-5">
          {{ usersStore.error }}
        </div>
        
        <div v-else-if="usersStore.items.length === 0" class="text-center py-10 text-gray-600 bg-gray-100 rounded-lg">
          No users found.
        </div>
        
        <div v-else class="grid gap-4">
          <div 
            v-for="user in usersStore.items" 
            :key="user.id" 
            class="p-5 border border-gray-200 rounded-lg bg-white"
          >
            <div class="flex justify-between items-center mb-2.5">
              <h4 class="m-0 text-gray-900">{{ user.id }}</h4>
            </div>
            <p>Profile: {{ JSON.stringify(user.profile) }}</p>
            <div class="mt-2.5 text-xs text-gray-600">
              <span v-if="user.createdAt">Created: {{ new Date(user.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Knowledge Base Tab -->
      <div v-if="activeTab === 'knowledge'" class="tab-content">
        <h2 class="mt-0 mb-5">Knowledge Base</h2>
        
        <div v-if="knowledgeStore.isLoading" class="text-center py-10 text-gray-600">
          Loading knowledge sections...
        </div>
        
        <div v-else-if="knowledgeStore.error" class="p-4 bg-red-100 text-red-800 border border-red-300 rounded mb-5">
          {{ knowledgeStore.error }}
        </div>
        
        <div v-else-if="knowledgeStore.sections.length === 0" class="text-center py-10 text-gray-600 bg-gray-100 rounded-lg">
          No knowledge sections found.
        </div>
        
        <div v-else class="grid gap-4">
          <div 
            v-for="section in knowledgeStore.sections" 
            :key="section.id" 
            class="p-5 border border-gray-200 rounded-lg bg-white"
          >
            <div class="flex justify-between items-center mb-2.5">
              <h4 class="m-0 text-gray-900">{{ section.name }}</h4>
              <span class="px-3 py-1 rounded-xl text-xs font-medium bg-blue-600 text-white">Order: {{ section.order }}</span>
            </div>
            <p v-if="section.description">{{ section.description }}</p>
            <div class="mt-2.5 text-xs text-gray-600">
              <span>Created: {{ new Date(section.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
