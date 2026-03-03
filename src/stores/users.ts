import { defineStore } from 'pinia'
import { createProjectResourceStore } from './utils/resource'
import type {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from '@/api/types'

export const useUsersStore = defineStore('users', () => {
  const store = createProjectResourceStore<UserResponse, CreateUserRequest, UpdateUserRequest>({
    endpoint: '/projects/{projectId}/users',
    resourceName: 'user',
    apiResourceName: 'users',
  })

  return store
})
