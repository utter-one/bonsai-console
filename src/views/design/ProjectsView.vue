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
  <div class="max-w-[1400px] mx-auto">
    <div class="flex justify-between items-start mb-6">
      <div>
        <h1 class="m-0 mb-1 text-3xl font-bold text-gray-900">Projects</h1>
        <p class="m-0 text-gray-600">Manage your AI application projects</p>
      </div>
      <button @click="showCreateModal = true" class="px-5 py-2.5 border-none bg-primary-500 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-600">
        + New Project
      </button>
    </div>

    <div v-if="projectsStore.isLoading" class="text-center py-16 px-5 text-gray-600">Loading projects...</div>
    
    <div v-else-if="projectsStore.error" class="text-center py-16 px-5 text-red-600">{{ projectsStore.error }}</div>
    
    <div v-else-if="projectsStore.items.length === 0" class="text-center py-16 px-5 text-gray-600">
      <p>No projects yet. Create your first project!</p>
    </div>
    
    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
      <div v-for="project in projectsStore.items" :key="project.id" class="bg-white border border-gray-200 rounded-lg p-5 transition-all hover:border-primary-500 hover:shadow-md">
        <div class="flex justify-between items-start mb-3">
          <h3 class="m-0 text-lg font-semibold text-gray-900">{{ project.name }}</h3>
        </div>
        <p v-if="project.description" class="m-0 mb-3 text-sm text-gray-600">{{ project.description }}</p>
        <div class="text-xs text-gray-400 mb-4">
          <span>Created {{ new Date(project.createdAt).toLocaleDateString() }}</span>
        </div>
        <div class="flex gap-2">
          <button @click="selectProject(project.id)" class="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-md font-medium cursor-pointer transition-all hover:border-primary-500 hover:text-primary-500">Configure</button>
          <button @click="deleteProject(project.id, project.name)" class="px-4 py-2 border-none bg-red-600 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5" @click="showCreateModal = false">
      <div class="bg-white rounded-lg p-6 max-w-lg w-full" @click.stop>
        <h2 class="m-0 mb-5 text-xl font-semibold">Create New Project</h2>
        <form @submit.prevent="createProject">
          <div class="mb-4">
            <label class="block mb-1.5 font-medium text-gray-900">Project Name</label>
            <input v-model="projectForm.name" type="text" required placeholder="My AI Project" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500" />
          </div>
          <div class="mb-4">
            <label class="block mb-1.5 font-medium text-gray-900">Description</label>
            <textarea v-model="projectForm.description" rows="3" placeholder="Optional description" class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500"></textarea>
          </div>
          <div class="flex gap-3 justify-end mt-5">
            <button type="button" @click="showCreateModal = false" class="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-md font-medium cursor-pointer transition-all hover:border-primary-500 hover:text-primary-500">Cancel</button>
            <button type="submit" class="px-5 py-2.5 border-none bg-primary-500 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-600">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
