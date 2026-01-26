<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'

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
  <div class="login-page">
    <div class="login-container">
      <div v-if="isCheckingSetup" class="checking-card">
        <div class="spinner"></div>
        <p>Checking system status...</p>
      </div>

      <div v-else class="login-card">
        <div class="login-header">
          <h1>Nexus Admin</h1>
          <p>Sign in to manage your AI platform</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div v-if="errorMessage" class="error-alert">
            {{ errorMessage }}
          </div>

          <div class="form-group">
            <label for="id">Admin ID / Email</label>
            <input
              id="id"
              v-model="loginForm.id"
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
              v-model="loginForm.password"
              type="password"
              required
              placeholder="Enter your password"
              :disabled="isLoading"
            />
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 420px;
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

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
}

.login-header p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.login-form {
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

.login-button {
  padding: 14px;
  border: none;
  border-radius: 6px;
  background: #667eea;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-button:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.login-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 24px;
  }

  .login-header h1 {
    font-size: 24px;
  }
}
</style>
