<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'

const router = useRouter()
const projectsStore = useProjectsStore()

const showCreateModal = ref(false)
const projectForm = ref({
  name: '',
  description: '',
})

onMounted(async () => {
  await projectsStore.fetchAll({ offset: 0, limit: 20 })
})

async function createProject() {
  if (!projectForm.value.name) return
  
  try {
    await projectsStore.create(projectForm.value)
    showCreateModal.value = false
    projectForm.value = { name: '', description: '' }
  } catch (error) {
    console.error('Failed to create project:', error)
  }
}

async function deleteProject(id: string, name: string) {
  if (!confirm(`Delete project "${name}"?`)) return
  await projectsStore.remove(id)
}

function selectProject(projectId: string) {
  router.push({ name: 'design.personas', params: { projectId } })
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
      <button @click="showCreateModal = true" class="btn-primary">
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
          <span>Created {{ new Date(project.createdAt).toLocaleDateString() }}</span>
        </div>
        <div class="flex gap-2">
          <button @click="selectProject(project.id)" class="btn-secondary">Configure</button>
          <button @click="deleteProject(project.id, project.name)" class="btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <h2 class="modal-header">Create New Project</h2>
        <form @submit.prevent="createProject">
          <div class="form-group">
            <label class="form-label">Project Name</label>
            <input v-model="projectForm.name" type="text" required placeholder="My AI Project" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea v-model="projectForm.description" rows="3" placeholder="Optional description" class="form-textarea"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showCreateModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  </AdministrationSectionLayout>
</template>
