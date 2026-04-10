<template>
  <BaseModal :title="issue ? (isReadOnly ? 'View Issue' : 'Edit Issue') : 'Create Issue'" size="xl" @close="$emit('close')">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        {{ issue ? 'Update the issue details' : 'Create a new bug report' }}The page is reloading.
      </p>

      <div v-if="issue" class="border-b border-gray-200 dark:border-gray-700 mb-4">
        <TabNavigator v-model="activeTab" :tabs="tabs" />
      </div>

      <div v-if="isReadOnly" class="alert-warning mb-4">
        This issue is read-only because its project is archived.
      </div>

      <div v-if="!issue || activeTab === 'details'">
      <form @submit.prevent="handleSubmit">
        <fieldset :disabled="isReadOnly" class="border-0 p-0 m-0 min-w-0 w-full">
          <!-- Row 1: Project, Stage, Conversation ID -->
          <div class="grid grid-cols-3 gap-4 mb-4">
            <FormField label="Project" :path="'projectId'" :error="props.error" required class="w-full">
              <select 
                v-model="form.projectId" 
                class="form-select"
                :disabled="!!issue || (!!prefillData?.projectId && !!prefillData?.sessionId)"
              >
                <option value="" disabled>Select a project</option>
                <option v-for="project in projectOptions" :key="project.value" :value="project.value" :disabled="project.archived">
                  {{ project.label }}
                </option>
              </select>
            </FormField>

            <FormField label="Stage" class="w-full">
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
            </FormField>

            <FormField label="Conversation ID" class="w-full">
              <div class="relative">
                <input
                  v-model="form.sessionId"
                  type="text"
                  placeholder="Session/Conversation ID"
                  class="form-input"
                  :class="{ 'input-with-action': form.sessionId }"
                />
                <a
                  v-if="form.sessionId && issue"
                  href="#"
                  @click.prevent="navigateToConversation"
                  class="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-blue-600"
                  title="View conversation"
                >
                  <ExternalLink class="w-4 h-4" />
                </a>
              </div>
            </FormField>
          </div>

          <!-- Row 2: Environment, Build Version -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <FormField label="Environment" class="w-full">
              <select v-model="form.environment" class="form-select" :disabled="!environmentOptions.length">
                <option value="">{{!environmentOptions.length ? 'No environments available' : 'None'}}</option>
                <option v-for="env in environmentOptions" :key="env.id" :value="env.id">
                  {{ env.description }}
                </option>
              </select>
            </FormField>

            <FormField label="Build Version" :path="'buildVersion'" :error="props.error" required class="w-full">
              <input
                v-model="form.buildVersion"
                type="text"
                placeholder="e.g., v1.2.3"
                class="form-input"
              />
            </FormField>
          </div>

          <!-- Row 3: Category, Severity, Status -->
          <div class="grid grid-cols-3 gap-4 mb-4">
            <FormField label="Category" :path="'category'" :error="props.error" required class="w-full">
              <select v-model="form.category" class="form-select">
                <option value="" disabled>Select category</option>
                <option v-for="cat in categoryOptions" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
            </FormField>

            <FormField label="Severity" :path="'severity'" :error="props.error" required class="w-full">
              <select v-model="form.severity" class="form-select">
                <option value="" disabled>Select severity</option>
                <option v-for="sev in severityOptions" :key="sev" :value="sev">
                  {{ sev }}
                </option>
              </select>
            </FormField>

            <FormField label="Status" :path="'status'" :error="props.error" required class="w-full">
              <select v-model="form.status" class="form-select" :disabled="!issue">
                <option value="" disabled>Select status</option>
                <option v-for="stat in statusOptions" :key="stat" :value="stat">
                  {{ stat }}
                </option>
              </select>
            </FormField>
          </div>

          <!-- Bug Description -->
          <FormField label="Bug Description" :path="'bugDescription'" :error="props.error" required class="w-full">
            <textarea
              v-model="form.bugDescription"
              rows="4"
              placeholder="Describe the bug in detail..."
              class="form-textarea"
            ></textarea>
          </FormField>

          <!-- Expected Behaviour -->
          <FormField label="Expected Behaviour" :path="'expectedBehaviour'" :error="props.error" required class="w-full">
            <textarea
              v-model="form.expectedBehaviour"
              rows="4"
              placeholder="Describe what should happen instead..."
              class="form-textarea"
            ></textarea>
          </FormField>

          <!-- Comments -->
          <FormField label="Comments" class="w-full">
            <textarea
              v-model="form.comments"
              rows="2"
              placeholder="Additional notes or comments..."
              class="form-textarea"
            ></textarea>
          </FormField>
        </fieldset>

        <div class="modal-footer">
          <ErrorDisplay v-if="error" :error="error" class="flex-1 mr-2 self-start" />
          <button type="button" @click="$emit('close')" class="btn-secondary">
            {{ isReadOnly ? 'Close' : 'Cancel' }}
          </button>
          <button v-if="!isReadOnly" type="submit" class="btn-primary">
            {{ issue ? 'Save Changes' : 'Create' }}
          </button>
        </div>
      </form>
      </div>

      <div v-if="issue && activeTab === 'history'">
        <EntityHistoryView
          v-if="loadHistory"
          :load-history="loadHistory"
          :current-object="issue"
          :active="activeTab === 'history'"
          :update-fn="updateFn"
          :create-fn="createFn"
          :ignore-fields="['updatedAt']"
          @recover-success="emit('recoverSuccess')"
        />
        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-secondary">Close</button>
        </div>
      </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { IssueResponse, CreateIssueRequest, UpdateIssueRequest, ParsedError } from '@/api/types'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useProjectsStore } from '@/stores/projects'
import { useEnvironmentsStore } from '@/stores/environments'
import { useStagesStore } from '@/stores/stages'
import { useVersionStore } from '@/stores'
import { ExternalLink } from 'lucide-vue-next'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import BaseModal from '@/components/BaseModal.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import FormField from '@/components/FormField.vue'

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
  error?: ParsedError | null
  loadHistory?: () => Promise<any>
  updateFn?: (data: any) => Promise<any>
  createFn?: (data: any) => Promise<any>
}>()

const emit = defineEmits<{
  close: []
  save: [data: CreateIssueRequest | UpdateIssueRequest]
  recoverSuccess: []
}>()

const projectsStore = useProjectsStore()
const environmentsStore = useEnvironmentsStore()
const stagesStore = useStagesStore()
const versionStore = useVersionStore()
const router = useRouter()
const activeTab = ref<'details' | 'history'>('details')

const tabs = computed<TabDefinition[]>(() => [
  { key: 'details', label: 'Details' },
  { key: 'history', label: 'History' },
])

watch(() => props.issue, () => {
  activeTab.value = 'details'
})

function navigateToConversation() {
  if (!form.value.sessionId) return
  emit('close')
  const query: Record<string, string> = {}
  if (form.value.eventIndex !== null) {
    query.highlightEventIndex = String(form.value.eventIndex)
  }
  router.push({
    name: 'monitor.conversationDetail',
    params: { conversationId: form.value.sessionId },
    query,
  })
}

const severityOptions = ['critical', 'major', 'minor', 'trivial']
const categoryOptions = ['intent', 'ai answer', 'entity', 'tool']
const statusOptions = ['awaiting', 'in-progress', 'ready-to-test', 'still-occurs', 'done', 'cannot-reproduce', 'wont-fix']


const form = ref({
  projectId: '',
  environment: '',
  buildVersion: versionStore.versionData?.version ?? '',
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
        buildVersion: versionStore.versionData?.version ?? '',
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

.input-with-action {
  padding-right: 2.25rem;
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
