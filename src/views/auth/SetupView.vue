<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { Rocket } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const setupForm = ref({
  id: '',
  name: '',
  password: '',
  confirmPassword: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const isChecking = ref(true)

onMounted(async () => {
  // Check if setup is already complete
  try {
    const status = await authStore.checkSetupStatus()
    if (status.isSetup) {
      router.push({ name: 'login' })
      return
    }
  } catch (error) {
    errorMessage.value = 'Failed to check setup status'
  } finally {
    isChecking.value = false
  }
})

async function handleSetup() {
  errorMessage.value = ''

  // Validate passwords match
  if (setupForm.value.password !== setupForm.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (setupForm.value.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters'
    return
  }

  isLoading.value = true

  try {
    await authStore.createInitialAdmin({
      id: setupForm.value.id,
      name: setupForm.value.name,
      password: setupForm.value.password,
    })

    router.push({ name: 'dashboard' })
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Setup failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="w-full max-w-[520px]">
      <div v-if="isChecking" class="auth-card text-center py-16">
        <div class="spinner mx-auto mb-5"></div>
        <p class="text-gray-700">Checking system status...</p>
      </div>

      <div v-else class="auth-card">
        <div class="auth-header">
          <div class="flex justify-center text-gradient-from mb-4">
            <Rocket :size="40" />
          </div>
          <h1 class="auth-title">Welcome to Bonsai Console</h1>
          <p class="auth-subtitle">Let's set up your initial administrator account</p>
        </div>

        <form @submit.prevent="handleSetup" class="auth-form">
          <div v-if="errorMessage" class="alert-error">
            {{ errorMessage }}
          </div>

          <div class="flex flex-col gap-2">
            <label for="name" class="form-label">Name</label>
            <input
              id="name"
              v-model="setupForm.name"
              type="text"
              required
              placeholder="John Doe"
              :disabled="isLoading"
              class="form-input px-3 py-3"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="id" class="form-label">Admin ID / Email</label>
            <input
              id="id"
              v-model="setupForm.id"
              type="text"
              required
              placeholder="admin@example.com or admin-user"
              :disabled="isLoading"
              class="form-input px-3 py-3"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="setupForm.password"
              type="password"
              required
              placeholder="Minimum 8 characters"
              :disabled="isLoading"
              class="form-input px-3 py-3"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="confirmPassword" class="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="setupForm.confirmPassword"
              type="password"
              required
              placeholder="Re-enter password"
              :disabled="isLoading"
              class="form-input px-3 py-3"
            />
          </div>

          <button type="submit" :disabled="isLoading" class="btn-auth mt-2">
            {{ isLoading ? 'Creating Account...' : 'Complete Setup' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
