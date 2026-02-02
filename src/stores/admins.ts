import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  AdminResponse,
  CreateAdminRequest,
  UpdateAdminRequest,
} from '@/api/types'

export const useAdminsStore = defineStore('admins', () => {
  const store = createResourceStore<AdminResponse, CreateAdminRequest, UpdateAdminRequest>({
    endpoint: '/admins',
    resourceName: 'admin',
    apiResourceName: 'admins',
  })

  return store
})
