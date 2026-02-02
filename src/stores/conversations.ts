import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  ConversationResponse,
  ConversationEventResponse,
  ListParams,
  AuditLogResponse,
} from '@/api/types'

export const useConversationsStore = defineStore('conversations', () => {
  const conversations = ref<ConversationResponse[]>([])
  const currentConversation = ref<ConversationResponse | null>(null)
  const events = ref<ConversationEventResponse[]>([])
  const currentEvent = ref<ConversationEventResponse | null>(null)
  const auditLogs = ref<AuditLogResponse[]>([])
  
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    offset: 0,
    limit: null as number | null,
  })

  async function fetchAll(params?: ListParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.conversationsList(params)
      conversations.value = response.items
      pagination.value = {
        total: response.total,
        offset: response.offset,
        limit: response.limit,
      }
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch conversations'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchById(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.conversationsDetail(id)
      currentConversation.value = response
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch conversation'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function remove(id: string) {
    isLoading.value = true
    error.value = null

    try {
      await apiClient.conversationsDelete(id)
      conversations.value = conversations.value.filter((c) => c.id !== id)
      if (currentConversation.value?.id === id) {
        currentConversation.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete conversation'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEvents(conversationId: string, params?: ListParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.conversationsEventsList(conversationId, params) as any
      events.value = response.items
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch conversation events'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEventById(conversationId: string, eventId: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.conversationsEventsDetail(conversationId, eventId) as any
      currentEvent.value = response
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch conversation event'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAuditLogs(conversationId: string, _params?: ListParams) {
    isLoading.value = true
    error.value = null

    try {
      // Note: The generated API doesn't properly support pagination params for audit logs yet
      const response = await apiClient.conversationsAuditLogsList(conversationId) as any
      auditLogs.value = response.items || []
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch audit logs'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    conversations,
    currentConversation,
    events,
    currentEvent,
    auditLogs,
    isLoading,
    error,
    pagination,
    fetchAll,
    fetchById,
    remove,
    fetchEvents,
    fetchEventById,
    fetchAuditLogs,
  }
})
