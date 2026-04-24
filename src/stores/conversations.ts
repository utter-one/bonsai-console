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

  async function fetchAll(projectId: string, params?: ListParams) {
    if (!projectId) {
      conversations.value = []
      pagination.value = { total: 0, offset: 0, limit: null }
      return
    }
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsConversationsList(projectId, params) as any
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

  async function fetchById(projectId: string, id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsConversationsDetail(projectId, id) as any
      currentConversation.value = response
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch conversation'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function remove(projectId: string, id: string) {
    isLoading.value = true
    error.value = null

    try {
      await apiClient.projectsConversationsDelete(projectId, id)
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

  async function fetchEvents(projectId: string, conversationId: string, params?: ListParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsConversationsEventsList(projectId, conversationId, params) as any
      events.value = response.items
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch conversation events'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEventById(projectId: string, conversationId: string, eventId: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsConversationsEventsDetail(projectId, conversationId, eventId) as any
      currentEvent.value = response
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch conversation event'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAuditLogs(projectId: string, conversationId: string, _params?: ListParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.projectsConversationsAuditLogsList(projectId, conversationId) as any
      auditLogs.value = response.items || []
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch audit logs'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function initiateVoiceCall(params: {
    apiKey: string
    channelProviderId: string
    to: string
    stageId?: string
  }): Promise<string> {
    const response = await apiClient.twilioVoiceCallCreate(
      { apiKey: params.apiKey, channelProviderId: params.channelProviderId },
      { to: params.to, stageId: params.stageId },
    ) as any
    return response.conversationId
  }

  async function initiateMessaging(params: {
    apiKey: string
    channelProviderId: string
    to: string
    body: string
    stageId?: string
  }): Promise<string> {
    const response = await apiClient.twilioMessagingSendCreate(
      { apiKey: params.apiKey, channelProviderId: params.channelProviderId },
      { to: params.to, body: params.body, stageId: params.stageId },
    ) as any
    return response.conversationId
  }

  async function initiateWhatsApp(params: {
    apiKey: string
    channelProviderId: string
    to: string
    templateName: string
    templateParams?: string[]
    stageId?: string
  }): Promise<string> {
    const response = await apiClient.whatsappSendCreate(
      { apiKey: params.apiKey, channelProviderId: params.channelProviderId },
      { to: params.to, templateName: params.templateName, templateParams: params.templateParams, stageId: params.stageId },
    ) as any
    return response.conversationId
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
    initiateVoiceCall,
    initiateMessaging,
    initiateWhatsApp,
  }
})
