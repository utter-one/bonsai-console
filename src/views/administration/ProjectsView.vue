<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import { DraftingCompass, FlaskConical, Search, X, BriefcaseBusiness, Plus } from 'lucide-vue-next'

const router = useRouter()
const projectsStore = useProjectsStore()

// Search state
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Watch for search query changes with debounce
watch(searchQuery, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
  }, 300)
})

// Filtered and sorted projects
const filteredProjects = computed(() => {
  let items = [...projectsStore.items]
  
  // Apply search filter
  if (debouncedSearchQuery.value) {
    const query = debouncedSearchQuery.value.toLowerCase()
    items = items.filter(project =>
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    )
  }
  
  // Apply alphabetical sorting
  return items.sort((a, b) => a.name.localeCompare(b.name))
})

function clearSearch() {
  searchQuery.value = ''
}

onMounted(async () => {
  await projectsStore.fetchAll({ offset: 0, limit: 20 })
})

function createProject() {
  router.push({ name: 'administration.projects.create' })
}

function editProject(projectId: string) {
  router.push({ name: 'administration.projects.edit', params: { projectId } })
}

async function deleteProject(id: string, name: string) {
  if (!confirm(`Delete project "${name}"?`)) return
  await projectsStore.remove(id)
}

function selectProject(projectId: string) {
  router.push({ name: 'design.stages', params: { projectId } })
}

function openPlayground(projectId: string) {
  router.push({ name: 'playground', params: { projectId } })
}
</script>

<template>
  <AdministrationSectionLayout>
    <div class="container-constrained">
    <div class="page-header">
      <div>
        <h1 class="page-title">Projects</h1>
        <p class="page-subtitle">Manage your AI application projects</p>
      </div>
      <button @click="createProject" class="btn-primary">
        <Plus class="inline-block mr-2 w-4 h-4" />
        New Project
      </button>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <Search class="input-icon-left" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name or description..."
        class="search-input"
      />
      <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
        <X class="w-5 h-5" />
      </button>
    </div>

    <div v-if="projectsStore.isLoading" class="loading-state">Loading projects...</div>
    
    <div v-else-if="projectsStore.error" class="error-state">{{ projectsStore.error }}</div>
    
    <div v-else-if="filteredProjects.length === 0" class="empty-state">
      <BriefcaseBusiness class="empty-state-icon" />
      <p v-if="searchQuery">No projects found matching "{{ searchQuery }}"</p>
      <p v-else>No projects yet. Create your first project!</p>
    </div>
    
    <div v-else class="grid-cards">
      <div v-for="project in filteredProjects" :key="project.id" class="project-card">
        <div class="project-card-header">
          <h3 class="project-card-title">{{ project.name }}</h3>
          <div class="flex gap-2">
            <button 
              @click="selectProject(project.id)" 
              class="btn-icon text-blue-600 hover:bg-blue-50"
              title="Design"
            >
              <DraftingCompass class="w-5 h-5" />
            </button>
            <button 
              @click="openPlayground(project.id)" 
              class="btn-icon text-green-600 hover:bg-green-50"
              title="Playground"
            >
              <FlaskConical class="w-5 h-5" />
            </button>
          </div>
        </div>
        <div class="project-card-meta">
          <span v-if="project.createdAt">Created {{ new Date(project.createdAt).toLocaleDateString() }}</span>
        </div>
        <div class="flex gap-2">
          <button @click="editProject(project.id)" class="btn-secondary">Edit</button>
          <button @click="deleteProject(project.id, project.name)" class="btn-danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
  </AdministrationSectionLayout>
</template>
