<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Calendar, User, FileText, Hash } from 'lucide-vue-next'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import apiClient from '@/api/client'
import type { AuditLogResponse } from '@/api/generated/data-contracts'

const route = useRoute()
const router = useRouter()

const auditLog = ref<AuditLogResponse | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const auditLogId = computed(() => route.params.auditLogId as string)

onMounted(async () => {
  await loadAuditLog()
})

async function loadAuditLog() {
  isLoading.value = true
  error.value = null
  
  try {
    // Fetch audit logs filtered by this specific ID
    const response = await apiClient.auditLogsList({
      filters: {
        id: {
          op: 'eq',
          value: auditLogId.value
        }
      },
      limit: 1
    })
    
    const log = response.items?.[0]
    if (log) {
      auditLog.value = log
    } else {
      error.value = 'Audit log not found'
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load audit log'
    console.error('Failed to load audit log:', err)
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'monitor.auditLogs' })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function getActionBadgeClass(action: string): string {
  if (action.toLowerCase().includes('create')) return 'badge-success'
  if (action.toLowerCase().includes('update')) return 'badge-active'
  if (action.toLowerCase().includes('delete')) return 'badge-error'
  return 'badge-secondary'
}

function formatJSON(obj: any): string {
  if (!obj) return 'N/A'
  return JSON.stringify(obj, null, 2)
}

// Get differences between old and new entity
const changes = computed(() => {
  if (!auditLog.value?.oldEntity || !auditLog.value?.newEntity) return []
  
  const oldEntity = auditLog.value.oldEntity as Record<string, any>
  const newEntity = auditLog.value.newEntity as Record<string, any>
  const diffs: Array<{ field: string; oldValue: any; newValue: any }> = []
  
  // Get all unique keys
  const allKeys = new Set([
    ...Object.keys(oldEntity),
    ...Object.keys(newEntity)
  ])
  
  allKeys.forEach(key => {
    const oldVal = oldEntity[key]
    const newVal = newEntity[key]
    
    // Skip metadata fields
    if (['id', 'createdAt', 'version'].includes(key)) return
    
    // Compare values (stringify for deep comparison)
    const oldStr = JSON.stringify(oldVal)
    const newStr = JSON.stringify(newVal)
    
    if (oldStr !== newStr) {
      diffs.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal
      })
    }
  })
  
  return diffs
})
</script>

<template>
  <MonitorSectionLayout>
    <div class="container-constrained">
      <!-- Back Button -->
      <button @click="goBack" class="mb-6 flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors">
        <ArrowLeft :size="20" />
        Back to Audit Logs
      </button>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        Loading audit log...
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>

      <!-- Audit Log Details -->
      <div v-else-if="auditLog" class="space-y-6">
        <!-- Header -->
        <div class="card">
          <div class="mb-6 pl-4 pt-4">
            <h1 class="page-title mb-2">Audit Log Details</h1>
            <p class="text-sm text-gray-600 font-mono dark:text-gray-400">{{ auditLog.id }}</p>
          </div>

          <!-- Metadata Grid -->
          <div class="metadata-container">
            <div class="metadata-item">
              <div class="metadata-label">
                <Calendar :size="16" class="text-gray-400" />
                <span>Timestamp</span>
              </div>
              <div class="metadata-value">{{ formatDate(auditLog.createdAt) }}</div>
            </div>

            <div class="metadata-item">
              <div class="metadata-label">
                <User :size="16" class="text-gray-400" />
                <span>User ID</span>
              </div>
              <div class="metadata-value font-mono">{{ auditLog.userId }}</div>
            </div>

            <div class="metadata-item">
              <div class="metadata-label">
                <FileText :size="16" class="text-gray-400" />
                <span>Action</span>
              </div>
              <div class="metadata-value">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getActionBadgeClass(auditLog.action)"
                >
                  {{ auditLog.action }}
                </span>
              </div>
            </div>

            <div class="metadata-item">
              <div class="metadata-label">
                <FileText :size="16" class="text-gray-400" />
                <span>Entity Type</span>
              </div>
              <div class="metadata-value">{{ auditLog.entityType }}</div>
            </div>

            <div class="metadata-item">
              <div class="metadata-label">
                <Hash :size="16" class="text-gray-400" />
                <span>Entity ID</span>
              </div>
              <div class="metadata-value font-mono">{{ auditLog.entityId }}</div>
            </div>

            <div class="metadata-item">
              <div class="metadata-label">
                <Hash :size="16" class="text-gray-400" />
                <span>Version</span>
              </div>
              <div class="metadata-value">{{ auditLog.version }}</div>
            </div>
          </div>
        </div>

        <!-- Changes Summary (for UPDATE actions) -->
        <div v-if="auditLog.action === 'UPDATE' && changes.length > 0" class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 pt-4 pl-4">Changes Summary</h2>
          <div class="space-y-4">
            <div v-for="change in changes" :key="change.field" class="border-l-4 border-blue-500 pl-4 py-2">
              <div class="font-medium text-gray-900 dark:text-gray-200 mb-2">{{ change.field }}</div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-xs text-gray-500 mb-1">Old Value</div>
                  <pre class="text-xs bg-red-50 border border-red-200 rounded p-2 overflow-x-auto">{{ formatJSON(change.oldValue) }}</pre>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">New Value</div>
                  <pre class="text-xs bg-green-50 border border-green-200 rounded p-2 overflow-x-auto">{{ formatJSON(change.newValue) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Old Entity (for UPDATE and DELETE) -->
        <div v-if="auditLog.oldEntity && (auditLog.action === 'UPDATE' || auditLog.action === 'DELETE')" class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 pt-4 pl-4">
            {{ auditLog.action === 'DELETE' ? 'Deleted Entity' : 'Previous State' }}
          </h2>
          <pre class="bg-gray-50 border-t border-gray-200 p-4 overflow-x-auto text-sm dark:bg-gray-900 dark:border-gray-700">{{ formatJSON(auditLog.oldEntity) }}</pre>
        </div>

        <!-- New Entity (for CREATE and UPDATE) -->
        <div v-if="auditLog.newEntity && (auditLog.action === 'CREATE' || auditLog.action === 'UPDATE')" class="card">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 pt-4 pl-4">
            {{ auditLog.action === 'CREATE' ? 'Created Entity' : 'Current State' }}
          </h2>
          <pre class="bg-gray-50 border-t border-gray-200 p-4 overflow-x-auto text-sm dark:bg-gray-900 dark:border-gray-700">{{ formatJSON(auditLog.newEntity) }}</pre>
        </div>
      </div>
    </div>
  </MonitorSectionLayout>
</template>

<style scoped>
.badge-active {
  background-color: rgb(220 252 231);
  color: rgb(22 101 52);
}

.badge-success {
  background-color: rgb(219 234 254);
  color: rgb(30 64 175);
}

.badge-error {
  background-color: rgb(254 226 226);
  color: rgb(153 27 27);
}

.badge-secondary {
  background-color: rgb(243 244 246);
  color: rgb(31 41 55);
}
</style>
