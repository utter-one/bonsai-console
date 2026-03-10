<template>
  <div class="modal-overlay">
    <div class="modal-content max-w-4xl" @click.stop>
      <h2 class="modal-header">{{ issue ? (isReadOnly ? 'View Issue' : 'Edit Issue') : 'Create Issue' }}</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        {{ issue ? 'Update the issue details' : 'Create a new bug report' }}
      </p>

      <div v-if="isReadOnly" class="alert-warning mb-4">
        This issue is read-only because its project is archived.
      </div>

      <form @submit.prevent="handleSubmit">
        <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">
          <!-- Row 1: Project, Stage, Conversation ID -->
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="form-group">
              <label class="form-label">
                Project <span class="required">*</span>
              </label>
              <select 
                v-model="form.projectId" 
                class="form-select"
                :disabled="!!issue || (!!prefillData?.projectId && !!prefillData?.sessionId)"
                required
              >
                <option value="" disabled>Select a project</option>
                <option v-for="project in projectOptions" :key="project.value" :value="project.value" :disabled="project.archived">
                  {{ project.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Stage (optional)</label>
              <select
                v-model="form.stage"
                class="form-select"
                :disabled="!form.projectId || (!!prefillData?.stageId && !!prefillData?.sessionId)"
              >
                <option value="">Select stage</option>
                <option v-for="stage in stageOptions" :key="stage.id" :value="stage.id">
                  {{ stage.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Conversation ID (optional)</label>
              <input
                v-model="form.sessionId"
                type="text"
                placeholder="Session/Conversation ID"
                class="form-input"
              />
            </div>
          </div>

          <!-- Row 2: Environment, Build Version -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="form-group">
              <label class="form-label">
                Environment
              </label>
              <select v-model="form.environment" class="form-select" :disabled="!environmentOptions.length">
                <option value="">{{!environmentOptions.length ? 'No environments available' : 'None'}}</option>
                <option v-for="env in environmentOptions" :key="env.id" :value="env.id">
                  {{ env.description }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">
                Build Version <span class="required">*</span>
              </label>
              <input
                v-model="form.buildVersion"
                type="text"
                placeholder="e.g., v1.2.3"
                class="form-input"
                required
              />
            </div>
          </div>

          <!-- Row 3: Category, Severity, Status -->
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="form-group">
              <label class="form-label">
                Category <span class="required">*</span>
              </label>
              <select v-model="form.category" class="form-select" required>
                <option value="" disabled>Select category</option>
                <option v-for="cat in categoryOptions" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">
                Severity <span class="required">*</span>
              </label>
              <select v-model="form.severity" class="form-select" required>
                <option value="" disabled>Select severity</option>
                <option v-for="sev in severityOptions" :key="sev" :value="sev">
                  {{ sev }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">
                Status <span class="required">*</span>
              </label>
              <select v-model="form.status" class="form-select" :disabled="!issue" required>
                <option value="" disabled>Select status</option>
                <option v-for="stat in statusOptions" :key="stat" :value="stat">
                  {{ stat }}
                </option>
              </select>
            </div>
          </div>

          <!-- Bug Description -->
          <div class="form-group">
            <label class="form-label">
              Bug Description <span class="required">*</span>
            </label>
            <textarea
              v-model="form.bugDescription"
              rows="4"
              required
              placeholder="Describe the bug in detail..."
              class="form-textarea"
            ></textarea>
          </div>

          <!-- Expected Behaviour -->
          <div class="form-group">
            <label class="form-label">
              Expected Behaviour <span class="required">*</span>
            </label>
            <textarea
              v-model="form.expectedBehaviour"
              rows="4"
              required
              placeholder="Describe what should happen instead..."
              class="form-textarea"
            ></textarea>
          </div>

          <!-- Comments -->
          <div class="form-group">
            <label class="form-label">Comments</label>
            <textarea
              v-model="form.comments"
              rows="2"
              placeholder="Additional notes or comments..."
              class="form-textarea"
            ></textarea>
          </div>
        </fieldset>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            {{ isReadOnly ? 'Close' : 'Cancel' }}
          </button>
          <button v-if="!isReadOnly" type="submit" class="btn-primary">
            {{ issue ? 'Save Changes' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type { IssueResponse, CreateIssueRequest, UpdateIssueRequest } from '@/api/types'
import { useProjectsStore } from '@/stores/projects'
import { useEnvironmentsStore } from '@/stores/environments'
import { useStagesStore } from '@/stores/stages'

interface PrefillData {
  projectId?: string
  sessionId?: string
  eventIndex?: number
  stageId?: string
}

const props = defineProps<{
  issue: IssueResponse | null
  prefillData?: PrefillData
  isReadOnly?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: CreateIssueRequest | UpdateIssueRequest]
}>()

const projectsStore = useProjectsStore()
const environmentsStore = useEnvironmentsStore()
const stagesStore = useStagesStore()

const severityOptions = ['critical', 'major', 'minor', 'trivial']
const categoryOptions = ['intent', 'ai answer', 'entity', 'tool']
const statusOptions = ['awaiting', 'in-progress', 'ready-to-test', 'still-occurs', 'done', 'cannot-reproduce', 'wont-fix']


const form = ref({
  projectId: '',
  environment: '',
  buildVersion: '',
  stage: '',
  sessionId: '',
  eventIndex: null as number | null,
  userId: '',
  severity: '',
  category: '',
  bugDescription: '',
  expectedBehaviour: '',
  comments: '',
  status: 'awaiting',
})

onMounted(async () => {
  await Promise.all([
    projectsStore.fetchUnfilteredProjects(),
    environmentsStore.fetchAll()
  ])
})

const projectOptions = computed(() =>
  projectsStore.unfilteredProjects.map(p => ({ label: p.name, value: p.id, archived: !!p.archivedAt }))
)

const environmentOptions = computed(() => {
  return environmentsStore.items.map(e => ({ id: e.id, description: e.description }))
})

const stageOptions = computed(() => {
  if (!form.value.projectId) return []
  return stagesStore.items.filter(s => s.projectId === form.value.projectId)
})

// Watch for project changes to load stages
watch(() => form.value.projectId, async (newProjectId) => {
  if (newProjectId) {
    try {
      await stagesStore.fetchAll(newProjectId)
    } catch (error) {
      console.error('Failed to load stages:', error)
    }
  }
  // Clear stage selection when project changes
  if (form.value.stage && !stageOptions.value.find(s => s.id === form.value.stage)) {
    form.value.stage = ''
  }
})

watch(
  () => props.issue,
  (issue) => {
    if (issue) {
      form.value = {
        projectId: issue.projectId,
        environment: issue.environment,
        buildVersion: issue.buildVersion,
        stage: issue.stage || '',
        sessionId: issue.sessionId || '',
        eventIndex: issue.eventIndex,
        userId: issue.userId || '',
        severity: issue.severity,
        category: issue.category,
        bugDescription: issue.bugDescription,
        expectedBehaviour: issue.expectedBehaviour,
        comments: issue.comments || '',
        status: issue.status,
      }
    } else {
      form.value = {
        projectId: props.prefillData?.projectId || '',
        environment: '',
        buildVersion: '',
        stage: props.prefillData?.stageId || '',
        sessionId: props.prefillData?.sessionId || '',
        eventIndex: props.prefillData?.eventIndex ?? null,
        userId: '',
        severity: '',
        category: '',
        bugDescription: '',
        expectedBehaviour: '',
        comments: '',
        status: 'awaiting',
      }
    }
  },
  { immediate: true }
)

const handleSubmit = () => {
  if (props.issue) {
    const updateData: UpdateIssueRequest = {
      environment: form.value.environment || undefined,
      buildVersion: form.value.buildVersion || undefined,
      stage: form.value.stage || undefined,
      sessionId: form.value.sessionId || undefined,
      eventIndex: form.value.eventIndex ?? undefined,
      userId: form.value.userId || undefined,
      severity: form.value.severity,
      category: form.value.category,
      bugDescription: form.value.bugDescription,
      expectedBehaviour: form.value.expectedBehaviour,
      comments: form.value.comments,
      status: form.value.status,
    }
    emit('save', updateData)
  } else {
    const createData: CreateIssueRequest = {
      projectId: form.value.projectId,
      environment: form.value.environment,
      buildVersion: form.value.buildVersion,
      stage: form.value.stage || undefined,
      sessionId: form.value.sessionId || undefined,
      eventIndex: form.value.eventIndex ?? undefined,
      userId: form.value.userId || undefined,
      severity: form.value.severity,
      category: form.value.category,
      bugDescription: form.value.bugDescription,
      expectedBehaviour: form.value.expectedBehaviour,
      comments: form.value.comments || '',
      status: form.value.status,
    }
    emit('save', createData)
  }
}
</script>

<style scoped>
.max-w-4xl {
  max-width: 56rem;
}

.required {
  color: #ef4444;
}

.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.gap-4 {
  gap: 1rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mb-6 {
  margin-bottom: 1.5rem;
}
</style>
