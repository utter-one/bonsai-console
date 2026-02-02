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
  ListParams,
} from '@/api/types'

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
  async function fetchSections(params?: ListParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.knowledgeSectionsList(params)
      sections.value = response.items
      return response
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
      const response = await apiClient.knowledgeSectionsDetail(id)
      currentSection.value = response
      return response
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
      const response = await apiClient.knowledgeSectionsCreate(data)
      sections.value.unshift(response)
      return response
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
      const response = await apiClient.knowledgeSectionsUpdate(id, data)
      const index = sections.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        sections.value[index] = response
      }
      return response
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
      await apiClient.knowledgeSectionsDelete(id)
      sections.value = sections.value.filter((s) => s.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete knowledge section'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Category Methods
  async function fetchCategories(params?: ListParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.knowledgeCategoriesList(params)
      categories.value = response.items
      return response
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
      const response = await apiClient.knowledgeCategoriesDetail(id)
      currentCategory.value = response
      return response
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
      const response = await apiClient.knowledgeCategoriesCreate(data)
      categories.value.unshift(response)
      return response
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
      const response = await apiClient.knowledgeCategoriesUpdate(id, data)
      const index = categories.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        categories.value[index] = response
      }
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update knowledge category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteCategory(id: string, version?: number) {
    isLoading.value = true
    error.value = null

    try {
      const category = categories.value.find((c) => c.id === id)
      const ver = version ?? category?.version ?? 1
      await apiClient.knowledgeCategoriesDelete(id, { version: ver })
      categories.value = categories.value.filter((c) => c.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete knowledge category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Item Methods
  async function fetchItems(params?: ListParams) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.knowledgeItemsList(params)
      items.value = response.items
      return response
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
      const response = await apiClient.knowledgeItemsDetail(id)
      currentItem.value = response
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch knowledge item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchItemsByCategory(categoryId: string, _params?: ListParams) {
    isLoading.value = true
    error.value = null

    try {
      // Note: The generated API returns array directly for this endpoint
      const response = await apiClient.knowledgeCategoriesItemsList(categoryId) as any
      items.value = Array.isArray(response) ? response : response.items || []
      return Array.isArray(response) ? { items: response, total: response.length, offset: 0, limit: null } : response
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
      const response = await apiClient.knowledgeItemsCreate(data)
      items.value.unshift(response)
      return response
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
      const response = await apiClient.knowledgeItemsUpdate(id, data)
      const index = items.value.findIndex((i) => i.id === id)
      if (index !== -1) {
        items.value[index] = response
      }
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update knowledge item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteItem(id: string, version?: number) {
    isLoading.value = true
    error.value = null

    try {
      const item = items.value.find((i) => i.id === id)
      const ver = version ?? item?.version ?? 1
      await apiClient.knowledgeItemsDelete(id, { version: ver })
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
