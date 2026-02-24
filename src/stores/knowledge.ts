import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'
import type {
  KnowledgeCategoryResponse,
  KnowledgeItemResponse,
  CreateKnowledgeCategoryRequest,
  UpdateKnowledgeCategoryRequest,
  CreateKnowledgeItemRequest,
  UpdateKnowledgeItemRequest,
} from '@/api/types'

export const useKnowledgeStore = defineStore('knowledge', () => {
  const categories = ref<KnowledgeCategoryResponse[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    offset: 0,
    limit: null as number | null,
  })

  async function fetchCategories(projectId: string, params?: Record<string, any>) {
    if (!projectId) {
      categories.value = []
      pagination.value = { total: 0, offset: 0, limit: null }
      return
    }
    isLoading.value = true
    error.value = null
    try {
      const response = await apiClient.projectsKnowledgeCategoriesList(projectId, params as any) as any
      categories.value = response.items
      pagination.value = {
        total: response.total,
        offset: response.offset,
        limit: response.limit,
      }
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch knowledge categories'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createCategory(projectId: string, data: CreateKnowledgeCategoryRequest) {
    isLoading.value = true
    error.value = null
    try {
      const result = await apiClient.projectsKnowledgeCategoriesCreate(projectId, data) as KnowledgeCategoryResponse
      result.items = result.items ?? []
      categories.value = [result, ...categories.value]
      return result
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create knowledge category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateCategory(projectId: string, id: string, data: UpdateKnowledgeCategoryRequest) {
    isLoading.value = true
    error.value = null
    try {
      const result = await apiClient.projectsKnowledgeCategoriesUpdate(projectId, id, data) as KnowledgeCategoryResponse
      const index = categories.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        // Preserve locally-held items since the update response may omit them
        const existingItems = categories.value[index]?.items ?? []
        result.items = result.items ?? existingItems
        categories.value[index] = result
      }
      return result
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update knowledge category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteCategory(projectId: string, id: string, version: number) {
    isLoading.value = true
    error.value = null
    try {
      await apiClient.projectsKnowledgeCategoriesDelete(projectId, id, { version })
      categories.value = categories.value.filter((c) => c.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete knowledge category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createItem(projectId: string, data: CreateKnowledgeItemRequest) {
    isLoading.value = true
    error.value = null
    try {
      const result = await apiClient.projectsKnowledgeItemsCreate(projectId, data) as KnowledgeItemResponse
      const category = categories.value.find((c) => c.id === data.categoryId)
      if (category) {
        category.items = [...(category.items ?? []), result]
      }
      return result
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create knowledge item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateItem(projectId: string, id: string, categoryId: string, data: UpdateKnowledgeItemRequest) {
    isLoading.value = true
    error.value = null
    try {
      const result = await apiClient.projectsKnowledgeItemsUpdate(projectId, id, data) as KnowledgeItemResponse
      const category = categories.value.find((c) => c.id === categoryId)
      if (category?.items) {
        const idx = category.items.findIndex((i) => i.id === id)
        if (idx !== -1) {
          category.items[idx] = result
        }
      }
      return result
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update knowledge item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteItem(projectId: string, id: string, categoryId: string, version: number) {
    isLoading.value = true
    error.value = null
    try {
      await apiClient.projectsKnowledgeItemsDelete(projectId, id, { version })
      const category = categories.value.find((c) => c.id === categoryId)
      if (category?.items) {
        category.items = category.items.filter((i) => i.id !== id)
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete knowledge item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    categories,
    isLoading,
    error,
    pagination,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
  }
})
