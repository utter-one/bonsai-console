import { defineStore } from 'pinia'
import { createResourceStore } from './utils/resource'
import type {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from '@/types/api'

export const useUsersStore = defineStore('users', () => {
  const store = createResourceStore<UserResponse, CreateUserRequest, UpdateUserRequest>({
    endpoint: '/users',
    resourceName: 'user',
  })

  return store
})
