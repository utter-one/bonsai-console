<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import ProjectEditModal from '@/components/modals/ProjectEditModal.vue'
import type { ProjectResponse } from '@/types/api'

const router = useRouter()
const projectsStore = useProjectsStore()

const showModal = ref(false)
const editingProject = ref<ProjectResponse | null>(null)

onMounted(async () => {
  await projectsStore.fetchAll({ offset: 0, limit: 20 })
})

function openCreateModal() {
  editingProject.value = null
  showModal.value = true
}

function openEditModal(project: ProjectResponse) {
  editingProject.value = project
  showModal.value = true
}

async function handleSave(data: { name: string; description?: string; version?: number }) {
  try {
    if (editingProject.value) {
      await projectsStore.update(editingProject.value.id, {
        version: data.version!,
        name: data.name,
        description: data.description,
      })
    } else {
      await projectsStore.create({ 
        name: data.name,
        description: data.description,
      })
    }
    showModal.value = false
    editingProject.value = null
  } catch (error) {
    console.error('Failed to save project:', error)
  }
}

async function deleteProject(id: string, name: string) {
  if (!confirm(`Delete project "${name}"?`)) return
  await projectsStore.remove(id)
}

function selectProject(projectId: string) {
  router.push({ name: 'design.stages', params: { projectId } })
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
      <button @click="openCreateModal" class="btn-primary">
        + New Project
      </button>
    </div>

    <div v-if="projectsStore.isLoading" class="loading-state">Loading projects...</div>
    
    <div v-else-if="projectsStore.error" class="error-state">{{ projectsStore.error }}</div>
    
    <div v-else-if="projectsStore.items.length === 0" class="empty-state">
      <p>No projects yet. Create your first project!</p>
    </div>
    
    <div v-else class="grid-cards">
      <div v-for="project in projectsStore.items" :key="project.id" class="project-card">
        <div class="project-card-header">
          <h3 class="project-card-title">{{ project.name }}</h3>
        </div>
        <p v-if="project.description" class="project-card-description">{{ project.description }}</p>
        <div class="project-card-meta">
          <span v-if="project.createdAt">Created {{ new Date(project.createdAt).toLocaleDateString() }}</span>
        </div>
        <div class="flex gap-2">
          <button @click="selectProject(project.id)" class="btn-secondary">Design</button>
          <button @click="openEditModal(project)" class="btn-secondary">Edit</button>
          <button @click="deleteProject(project.id, project.name)" class="btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <ProjectEditModal
      v-if="showModal"
      :project="editingProject"
      @close="showModal = false"
      @save="handleSave"
    />
  </div>
  </AdministrationSectionLayout>
</template>
