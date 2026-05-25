<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Calendar, Clock, Hash, Bug, CheckCircle, AlertTriangle, MessageSquare, Code, Layers } from 'lucide-vue-next'

import apiClient from '@/api/client'
import RelativeDate from '@/components/RelativeDate.vue'
import type { IssueResponse } from '@/api/generated/data-contracts'

const route = useRoute()
const router = useRouter()

const issue = ref<IssueResponse | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const projectId = computed(() => route.params.projectId as string)
const issueId = computed(() => Number(route.params.issueId))

function getStatusSeverity(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('open') || s.includes('new')) return 'warning'
  if (s.includes('resolved') || s.includes('fixed')) return 'success'
  if (s.includes('closed') || s.includes('done')) return 'secondary'
  return 'info'
}

function getSeverityBadgeClass(severity: string): string {
  const s = severity.toLowerCase()
  if (s === 'critical') return 'badge badge-danger'
  if (s === 'major') return 'badge badge-warning'
  if (s === 'minor') return 'badge badge-info'
  return 'badge badge-secondary'
}

onMounted(async () => {
  await loadIssue()
})

async function loadIssue() {
  isLoading.value = true
  error.value = null

  try {
    const response = await apiClient.issuesList({
      limit: 1,
      filters: {
        id: { op: 'eq', value: issueId.value },
      },
    }) as any

    const found = response.items?.[0]
    if (found) {
      issue.value = found
    } else {
      error.value = 'Issue not found'
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load issue'
    console.error('Failed to load issue:', err)
  } finally {
    isLoading.value = false
  }
}

async function goBack() {
  router.push({ name: 'monitor.issues', params: { projectId: projectId.value } })
}
</script>

<template>
  <div class="flex-1 min-w-0" :project-id="projectId">
    <div class="container-constrained mx-auto">
      <!-- Header -->
      <div class="mb-6 flex items-center gap-4">
        <button @click="goBack" class="btn-icon">
          <ArrowLeft :size="18" />
        </button>
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <h1 class="page-title">Issue #{{ issueId }}</h1>
            <span v-if="issue" :class="getSeverityBadgeClass(issue.severity)" class="text-xs">{{ issue.severity }}</span>
          </div>
          <p v-if="issue" class="page-subtitle">{{ issue.category }} · {{ issue.environment }} · Build {{ issue.buildVersion }}</p>
        </div>
      </div>

      <!-- Loading / Error States -->
      <div v-if="isLoading" class="loading-state">Loading issue...</div>
      <div v-else-if="error" class="alert-error">{{ error }}</div>

      <!-- Issue Detail -->
      <div v-else-if="issue" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Bug Description -->
          <div class="section-card">
            <div class="flex items-center gap-2 mb-4">
              <Bug class="text-primary-500" :size="18" />
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Bug Description</h3>
            </div>
            <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ issue.bugDescription }}</p>
          </div>

          <!-- Expected Behavior -->
          <div v-if="issue.expectedBehaviour" class="section-card">
            <div class="flex items-center gap-2 mb-4">
              <CheckCircle class="text-emerald-500" :size="18" />
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Expected Behavior</h3>
            </div>
            <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ issue.expectedBehaviour }}</p>
          </div>

          <!-- Comments -->
          <div v-if="issue.comments" class="section-card">
            <div class="flex items-center gap-2 mb-4">
              <MessageSquare class="text-blue-500" :size="18" />
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Comments</h3>
            </div>
            <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ issue.comments }}</p>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Status -->
          <div class="section-card">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Status</h3>
            <span :class="`badge badge-${getStatusSeverity(issue.status)}`" class="text-sm px-3 py-1">
              {{ issue.status.replace(/_/g, ' ') }}
            </span>
          </div>

          <!-- Metadata -->
          <div class="section-card">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Details</h3>
            <div class="space-y-3">
              <div v-if="issue.projectId" class="flex items-center gap-2">
                <Hash :size="14" class="text-gray-400" />
                <span class="text-xs text-gray-500 dark:text-gray-400 w-16">Project</span>
                <router-link
                  :to="{ name: 'design.projects.stages', params: { projectId: issue.projectId } }"
                  class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline truncate"
                >
                  {{ issue.projectId }}
                </router-link>
              </div>

              <div v-if="issue.conversationId" class="flex items-center gap-2">
                <MessageSquare :size="14" class="text-gray-400" />
                <span class="text-xs text-gray-500 dark:text-gray-400 w-16">Conversation</span>
                <router-link
                  :to="{ name: 'monitor.conversationDetail', params: { conversationId: issue.conversationId } }"
                  class="text-xs font-mono text-primary-600 dark:text-primary-400 hover:underline truncate"
                >
                  {{ issue.conversationId.slice(-8) }}
                </router-link>
              </div>

              <div v-if="issue.stage" class="flex items-center gap-2">
                <Layers :size="14" class="text-gray-400" />
                <span class="text-xs text-gray-500 dark:text-gray-400 w-16">Stage</span>
                <span class="text-xs text-gray-700 dark:text-gray-300">{{ issue.stage }}</span>
              </div>

              <div v-if="issue.eventIndex != null" class="flex items-center gap-2">
                <Code :size="14" class="text-gray-400" />
                <span class="text-xs text-gray-500 dark:text-gray-400 w-16">Event</span>
                <span class="text-xs text-gray-700 dark:text-gray-300">#{{ issue.eventIndex }}</span>
              </div>

              <div v-if="issue.userId" class="flex items-center gap-2">
                <AlertTriangle :size="14" class="text-gray-400" />
                <span class="text-xs text-gray-500 dark:text-gray-400 w-16">User</span>
                <span class="text-xs font-mono text-gray-700 dark:text-gray-300">{{ issue.userId }}</span>
              </div>

              <div class="flex items-center gap-2">
                <Calendar :size="14" class="text-gray-400" />
                <span class="text-xs text-gray-500 dark:text-gray-400 w-16">Created</span>
                <RelativeDate :date="issue.createdAt" />
              </div>

              <div class="flex items-center gap-2">
                <Clock :size="14" class="text-gray-400" />
                <span class="text-xs text-gray-500 dark:text-gray-400 w-16">Updated</span>
                <RelativeDate :date="issue.updatedAt" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
