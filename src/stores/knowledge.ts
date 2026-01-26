import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  KnowledgeSectionResponse,
  CreateKnowledgeSectionRequest,
  UpdateKnowledgeSectionRequest,
  KnowledgeCategoryResponse,
  CreateKnowledgeCategoryRequest,
  UpdateKnowledgeCategoryRequest,
  KnowledgeItemResponse,
  CreateKnowledgeItemRequest,
  UpdateKnowledgeItemRequest,
  PaginationParams,
  PaginatedResponse,
} from '@/types/api'

export const useKnowledgeStore = defineStore('knowledge', () => {
  // Sections
  const sections = ref<KnowledgeSectionResponse[]>([])
  const currentSection = ref<KnowledgeSectionResponse | null>(null)

  // Categories
  const categories = ref<KnowledgeCategoryResponse[]>([])
  const currentCategory = ref<KnowledgeCategoryResponse | null>(null)

  // Items
  const items = ref<KnowledgeItemResponse[]>([])
  const currentItem = ref<KnowledgeItemResponse | null>(null)

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Section Methods
  async function fetchSections(params?: PaginationParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<PaginatedResponse<KnowledgeSectionResponse>>(
        '/knowledge/sections',
        { params }
      )
      sections.value = response.data.items
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch knowledge sections'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSectionById(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<KnowledgeSectionResponse>(`/knowledge/sections/${id}`)
      currentSection.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch knowledge section'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createSection(data: CreateKnowledgeSectionRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.post<KnowledgeSectionResponse>('/knowledge/sections', data)
      sections.value.unshift(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create knowledge section'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateSection(id: string, data: UpdateKnowledgeSectionRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.put<KnowledgeSectionResponse>(`/knowledge/sections/${id}`, data)
      const index = sections.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        sections.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update knowledge section'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteSection(id: string) {
    isLoading.value = true
    error.value = null

    try {
      await apiClient.delete(`/knowledge/sections/${id}`)
      sections.value = sections.value.filter((s) => s.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete knowledge section'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Category Methods
  async function fetchCategories(params?: PaginationParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<PaginatedResponse<KnowledgeCategoryResponse>>(
        '/knowledge/categories',
        { params }
      )
      categories.value = response.data.items
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch knowledge categories'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCategoryById(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<KnowledgeCategoryResponse>(`/knowledge/categories/${id}`)
      currentCategory.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch knowledge category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createCategory(data: CreateKnowledgeCategoryRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.post<KnowledgeCategoryResponse>('/knowledge/categories', data)
      categories.value.unshift(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create knowledge category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateCategory(id: string, data: UpdateKnowledgeCategoryRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.put<KnowledgeCategoryResponse>(`/knowledge/categories/${id}`, data)
      const index = categories.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        categories.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update knowledge category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteCategory(id: string) {
    isLoading.value = true
    error.value = null

    try {
      await apiClient.delete(`/knowledge/categories/${id}`)
      categories.value = categories.value.filter((c) => c.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete knowledge category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Item Methods
  async function fetchItems(params?: PaginationParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<PaginatedResponse<KnowledgeItemResponse>>(
        '/knowledge/items',
        { params }
      )
      items.value = response.data.items
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch knowledge items'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchItemById(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<KnowledgeItemResponse>(`/knowledge/items/${id}`)
      currentItem.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch knowledge item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchItemsByCategory(categoryId: string, params?: PaginationParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get<PaginatedResponse<KnowledgeItemResponse>>(
        `/knowledge/categories/${categoryId}/items`,
        { params }
      )
      items.value = response.data.items
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch knowledge items by category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createItem(data: CreateKnowledgeItemRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.post<KnowledgeItemResponse>('/knowledge/items', data)
      items.value.unshift(response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create knowledge item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateItem(id: string, data: UpdateKnowledgeItemRequest) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.put<KnowledgeItemResponse>(`/knowledge/items/${id}`, data)
      const index = items.value.findIndex((i) => i.id === id)
      if (index !== -1) {
        items.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update knowledge item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteItem(id: string) {
    isLoading.value = true
    error.value = null

    try {
      await apiClient.delete(`/knowledge/items/${id}`)
      items.value = items.value.filter((i) => i.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete knowledge item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    sections,
    currentSection,
    categories,
    currentCategory,
    items,
    currentItem,
    isLoading,
    error,

    // Section Methods
    fetchSections,
    fetchSectionById,
    createSection,
    updateSection,
    deleteSection,

    // Category Methods
    fetchCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,

    // Item Methods
    fetchItems,
    fetchItemById,
    fetchItemsByCategory,
    createItem,
    updateItem,
    deleteItem,
  }
})
