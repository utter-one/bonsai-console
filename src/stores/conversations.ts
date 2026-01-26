import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  ConversationResponse,
  ConversationEventResponse,
  PaginationParams,
  PaginatedResponse,
  AuditLogResponse,
} from '@/types/api'

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

  async function fetchAll(params?: PaginationParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<PaginatedResponse<ConversationResponse>>(
        '/conversations',
        { params }
      )
      conversations.value = response.data.items
      pagination.value = {
        total: response.data.total,
        offset: response.data.offset,
        limit: response.data.limit,
      }
      return response.data
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
      const response = await apiClient.get<ConversationResponse>(`/conversations/${id}`)
      currentConversation.value = response.data
      return response.data
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
      await apiClient.delete(`/conversations/${id}`)
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

  async function fetchEvents(conversationId: string, params?: PaginationParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<PaginatedResponse<ConversationEventResponse>>(
        `/conversations/${conversationId}/events`,
        { params }
      )
      events.value = response.data.items
      return response.data
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
      const response = await apiClient.get<ConversationEventResponse>(
        `/conversations/${conversationId}/events/${eventId}`
      )
      currentEvent.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch conversation event'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAuditLogs(conversationId: string, params?: PaginationParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<PaginatedResponse<AuditLogResponse>>(
        `/conversations/${conversationId}/audit-logs`,
        { params }
      )
      auditLogs.value = response.data.items
      return response.data
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
