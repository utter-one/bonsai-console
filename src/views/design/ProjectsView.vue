<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores'

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
  <div class="view-container">
    <div class="view-header">
      <div>
        <h1>Projects</h1>
        <p>Manage your AI application projects</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary">
        + New Project
      </button>
    </div>

    <div v-if="projectsStore.isLoading" class="loading">Loading projects...</div>
    
    <div v-else-if="projectsStore.error" class="error">{{ projectsStore.error }}</div>
    
    <div v-else-if="projectsStore.items.length === 0" class="empty-state">
      <p>No projects yet. Create your first project!</p>
    </div>
    
    <div v-else class="projects-grid">
      <div v-for="project in projectsStore.items" :key="project.id" class="project-card">
        <div class="card-header">
          <h3>{{ project.name }}</h3>
        </div>
        <p v-if="project.description" class="description">{{ project.description }}</p>
        <div class="card-meta">
          <span>Created {{ new Date(project.createdAt).toLocaleDateString() }}</span>
        </div>
        <div class="card-actions">
          <button @click="selectProject(project.id)" class="btn-secondary">Configure</button>
          <button @click="deleteProject(project.id, project.name)" class="btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal" @click.stop>
        <h2>Create New Project</h2>
        <form @submit.prevent="createProject">
          <div class="form-group">
            <label>Project Name</label>
            <input v-model="projectForm.name" type="text" required placeholder="My AI Project" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="projectForm.description" rows="3" placeholder="Optional description"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.view-header h1 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
}

.view-header p {
  margin: 0;
  color: #666;
}

.btn-primary {
  padding: 10px 20px;
  border: none;
  background: #1976d2;
  color: white;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: #1976d2;
  color: #1976d2;
}

.btn-danger {
  padding: 8px 16px;
  border: none;
  background: #dc3545;
  color: white;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: #c82333;
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.error {
  color: #dc3545;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.project-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.project-card:hover {
  border-color: #1976d2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: #ffebee;
  color: #c62828;
}

.badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.card-meta {
  font-size: 12px;
  color: #999;
  margin-bottom: 16px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
}

.modal h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1976d2;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
