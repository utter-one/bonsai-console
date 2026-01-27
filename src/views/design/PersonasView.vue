<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePersonasStore } from '@/stores'
import { Drama, Search, X } from 'lucide-vue-next'
import type { PersonaResponse } from '@/types/api'
import PersonaEditModal from '@/components/modals/PersonaEditModal.vue'

const route = useRoute()
const personasStore = usePersonasStore()

// UI State
const showCreateModal = ref(false)
const showEditModal = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// Forms
const personaForm = ref({
  id: '',
  name: '',
  prompt: '',
  voiceProviderId: '',
  metadata: {}
})

const editingPersona = ref<PersonaResponse | null>(null)

// Computed
const projectId = computed(() => route.params.projectId as string)

const filteredPersonas = computed(() => {
  if (!searchQuery.value) return personasStore.items
  const query = searchQuery.value.toLowerCase()
  return personasStore.items.filter(persona => 
    persona.id.toLowerCase().includes(query) ||
    persona.name.toLowerCase().includes(query) ||
    persona.prompt.toLowerCase().includes(query)
  )
})

// Lifecycle
onMounted(async () => {
  await loadPersonas()
})

// Methods
async function loadPersonas() {
  try {
    await personasStore.fetchAll({
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      filters: { projectId: projectId.value }
    })
  } catch (error) {
    console.error('Failed to load personas:', error)
  }
}

function openCreateModal() {
  personaForm.value = {
    id: '',
    name: '',
    prompt: '',
    voiceProviderId: '',
    metadata: {}
  }
  showCreateModal.value = true
}

function openEditModal(persona: PersonaResponse) {
  editingPersona.value = persona
  showEditModal.value = true
}

async function createPersona() {
  if (!personaForm.value.name || !personaForm.value.prompt) {
    alert('Please fill in all required fields')
    return
  }

  try {
    const createData: any = {
      projectId: projectId.value,
      name: personaForm.value.name,
      prompt: personaForm.value.prompt,
      metadata: personaForm.value.metadata
    }

    // Only include id if it's provided
    if (personaForm.value.id) {
      createData.id = personaForm.value.id
    }

    // Only include voiceProviderId if it's not empty
    if (personaForm.value.voiceProviderId) {
      createData.voiceProviderId = personaForm.value.voiceProviderId
    }

    await personasStore.create(createData)
    showCreateModal.value = false
    personaForm.value = {
      id: '',
      name: '',
      prompt: '',
      voiceProviderId: '',
      metadata: {}
    }
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to create persona')
  }
}

async function updatePersona(data: { name: string; prompt: string; voiceProviderId?: string; metadata: any }) {
  if (!editingPersona.value) return

  try {
    await personasStore.update(editingPersona.value.id, {
      version: editingPersona.value.version,
      name: data.name,
      prompt: data.prompt,
      metadata: data.metadata
    })
    showEditModal.value = false
    editingPersona.value = null
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to update persona')
  }
}

async function deletePersona(persona: PersonaResponse) {
  if (!confirm(`Delete persona "${persona.name}" (${persona.id})?\n\nThis action cannot be undone.`)) return

  try {
    await personasStore.remove(persona.id, persona.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete persona')
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function clearSearch() {
  searchQuery.value = ''
}
</script>

<template>
  <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Personas</h1>
          <p class="page-subtitle">Manage AI personas for this project</p>
        </div>
        <button @click="openCreateModal" class="btn-primary">
          <Drama class="inline-block mr-2 w-4 h-4" />
          New Persona
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by ID, name, or prompt..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="personasStore.isLoading" class="loading-state">
        Loading personas...
      </div>

      <!-- Error State -->
      <div v-else-if="personasStore.error" class="error-state">
        {{ personasStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredPersonas.length === 0" class="empty-state">
        <Drama class="empty-state-icon" />
        <p class="empty-state-title">No personas found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first persona to get started</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell">ID</th>
                <th class="table-header-cell">Name</th>
                <th class="table-header-cell">Prompt Preview</th>
                <th class="table-header-cell">Voice Provider</th>
                <th class="table-header-cell">Updated</th>
                <th class="table-header-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="persona in filteredPersonas" :key="persona.id" class="table-row">
                <td class="table-cell-mono">{{ persona.id }}</td>
                <td class="table-cell-medium">{{ persona.name }}</td>
                <td class="table-cell">
                  <span class="truncate max-w-md">{{ persona.prompt }}</span>
                </td>
                <td class="table-cell-mono">
                  <span v-if="persona.voiceProviderId" class="badge-secondary">
                    {{ persona.voiceProviderId }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell-muted">{{ formatDate(persona.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="openEditModal(persona)" class="btn-secondary btn-sm">
                      Edit
                    </button>
                    <button @click="deletePersona(persona)" class="btn-danger btn-sm">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Info -->
        <div class="table-footer">
          <div class="flex-between text-sm text-gray-600">
            <span>
              Showing {{ filteredPersonas.length }} of {{ personasStore.pagination.total }} personas
            </span>
            <span>Version tracking enabled (optimistic locking)</span>
          </div>
        </div>
      </div>

      <!-- Create Modal -->
      <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
        <div class="modal-content" @click.stop>
          <h2 class="modal-header">Create Persona</h2>
          
          <form @submit.prevent="createPersona">
            <div class="form-group">
              <label class="form-label">
                Name <span class="required">*</span>
              </label>
              <input
                v-model="personaForm.name"
                type="text"
                required
                placeholder="My Persona"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                Prompt <span class="required">*</span>
              </label>
              <textarea
                v-model="personaForm.prompt"
                required
                rows="6"
                class="form-textarea"
                placeholder="Enter the system prompt for this persona..."
              ></textarea>
              <p class="form-help-text">The system prompt that defines this persona's behavior</p>
            </div>

            <div class="form-group">
              <label class="form-label">Voice Provider ID</label>
              <input
                v-model="personaForm.voiceProviderId"
                type="text"
                class="form-input-mono"
                placeholder="optional-voice-provider-id"
              />
              <p class="form-help-text">Optional voice provider for text-to-speech</p>
            </div>

            <div class="modal-footer">
              <button type="button" @click="showCreateModal = false" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                Create Persona
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Modal -->
      <PersonaEditModal
        v-if="showEditModal"
        :persona="editingPersona"
        @close="showEditModal = false"
        @update="updatePersona"
      />
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
