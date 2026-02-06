<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import { DraftingCompass, FlaskConical } from 'lucide-vue-next'

const router = useRouter()
const projectsStore = useProjectsStore()

const sortedProjects = computed(() => {
  return [...projectsStore.items].sort((a, b) => a.name.localeCompare(b.name))
})

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
        + New Project
      </button>
    </div>

    <div v-if="projectsStore.isLoading" class="loading-state">Loading projects...</div>
    
    <div v-else-if="projectsStore.error" class="error-state">{{ projectsStore.error }}</div>
    
    <div v-else-if="projectsStore.items.length === 0" class="empty-state">
      <p>No projects yet. Create your first project!</p>
    </div>
    
    <div v-else class="grid-cards">
      <div v-for="project in sortedProjects" :key="project.id" class="project-card">
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
        <p v-if="project.description" class="project-card-description">{{ project.description }}</p>
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
