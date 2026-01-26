<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { Rocket } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const setupForm = ref({
  id: '',
  displayName: '',
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
      displayName: setupForm.value.displayName,
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
  <div class="setup-page">
    <div class="setup-container">
      <div v-if="isChecking" class="checking-card">
        <div class="spinner"></div>
        <p>Checking system status...</p>
      </div>

      <div v-else class="setup-card">
        <div class="setup-header">
          <div class="header-icon">
            <Rocket :size="40" />
          </div>
          <h1>Welcome to Nexus Admin</h1>
          <p>Let's set up your initial administrator account</p>
        </div>

        <form @submit.prevent="handleSetup" class="setup-form">
          <div v-if="errorMessage" class="error-alert">
            {{ errorMessage }}
          </div>

          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input
              id="displayName"
              v-model="setupForm.displayName"
              type="text"
              required
              placeholder="John Doe"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="id">Admin ID / Email</label>
            <input
              id="id"
              v-model="setupForm.id"
              type="text"
              required
              placeholder="admin@example.com or admin-user"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="setupForm.password"
              type="password"
              required
              placeholder="Minimum 8 characters"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="setupForm.confirmPassword"
              type="password"
              required
              placeholder="Re-enter password"
              :disabled="isLoading"
            />
          </div>

          <button type="submit" class="setup-button" :disabled="isLoading">
            {{ isLoading ? 'Creating Account...' : 'Complete Setup' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.setup-container {
  width: 100%;
  max-width: 520px;
}

.checking-card {
  background: white;
  border-radius: 12px;
  padding: 60px 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.setup-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.setup-header {
  text-align: center;
  margin-bottom: 32px;
}

.header-icon {
  display: flex;
  justify-content: center;
  color: #667eea;
  margin-bottom: 16px;
}

.setup-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
}

.setup-header p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-alert {
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  color: #c33;
  font-size: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.setup-button {
  padding: 14px;
  border: none;
  border-radius: 6px;
  background: #667eea;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.setup-button:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.setup-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 580px) {
  .setup-card {
    padding: 30px 24px;
  }

  .setup-header h1 {
    font-size: 24px;
  }
}
</style>
