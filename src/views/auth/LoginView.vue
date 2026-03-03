<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import logoUrl from '@/assets/logo.svg'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = ref({
  id: '',
  password: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const isCheckingSetup = ref(true)

onMounted(async () => {
  // Check if setup is complete first
  try {
    const status = await authStore.checkSetupStatus()
    if (!status.isSetup) {
      router.push({ name: 'setup' })
      return
    }
  } catch (error) {
    console.warn('Failed to check setup status:', error)
  } finally {
    isCheckingSetup.value = false
  }

  // If already authenticated, redirect to dashboard
  if (authStore.isAuthenticated) {
    router.push({ name: 'dashboard' })
  }
})

async function handleLogin() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await authStore.login(loginForm.value)
    
    // Check for redirect query param
    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect || { name: 'dashboard' })
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Login failed. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="w-full max-w-md">
      <div v-if="isCheckingSetup" class="auth-card text-center py-16">
        <div class="spinner mx-auto mb-5"></div>
        <p class="text-gray-700 dark:text-gray-300">Checking system status...</p>
      </div>

      <div v-else class="auth-card">
        <div class="auth-header">
          <img :src="logoUrl" alt="Bonsai Console" class="mx-auto mb-4 h-20 w-20" />
          <h1 class="auth-title">Bonsai Console</h1>
          <p class="auth-subtitle">Sign in to manage your AI platform</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div v-if="errorMessage" class="alert-error">
            {{ errorMessage }}
          </div>

          <div class="flex flex-col gap-2">
            <label for="id" class="form-label">Operator ID / Email</label>
            <input
              id="id"
              v-model="loginForm.id"
              type="text"
              required
              placeholder="operator@example.com or operator-id"
              :disabled="isLoading"
              class="form-input px-3 py-3"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="loginForm.password"
              type="password"
              required
              placeholder="Enter your password"
              :disabled="isLoading"
              class="form-input px-3 py-3"
            />
          </div>

          <button type="submit" :disabled="isLoading" class="btn-auth mt-2">
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
