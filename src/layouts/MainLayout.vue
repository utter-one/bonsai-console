<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore, useProjectsStore } from '@/stores'
import { Home, Palette, Activity, Search, Settings, Menu } from 'lucide-vue-next'
import type { Component } from 'vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()

const currentSection = computed(() => {
  const path = route.path
  if (path.startsWith('/design')) return 'design'
  if (path.startsWith('/monitor')) return 'monitor'
  if (path.startsWith('/analyze')) return 'analyze'
  if (path.startsWith('/settings')) return 'settings'
  return 'dashboard'
})

const selectedProjectId = ref<string | null>(null)
const showUserMenu = ref(false)
const showMobileMenu = ref(false)

function navigateToSection(section: string) {
  if (section === 'dashboard') {
    router.push({ name: 'dashboard' })
  } else {
    router.push({ name: section })
  }
  showMobileMenu.value = false
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}

// Sections for navigation
const sections: Array<{ id: string; label: string; icon: Component }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'monitor', label: 'Monitor', icon: Activity },
  { id: 'analyze', label: 'Analyze', icon: Search },
  { id: 'settings', label: 'Settings', icon: Settings },
]
</script>

<template>
  <div class="main-layout">
    <!-- Top Navigation Bar -->
    <header class="top-bar">
      <div class="top-bar-content">
        <!-- Logo & Brand -->
        <div class="brand">
          <h1>Nexus Admin</h1>
        </div>

        <!-- Main Navigation -->
        <nav class="main-nav">
          <button
            v-for="section in sections"
            :key="section.id"
            :class="['nav-item', { active: currentSection === section.id }]"
            @click="navigateToSection(section.id)"
          >
            <component :is="section.icon" class="icon" :size="18" />
            <span class="label">{{ section.label }}</span>
          </button>
        </nav>

        <!-- Right Side Actions -->
        <div class="top-bar-actions">
          <!-- Project Selector (only show if not in settings) -->
          <div v-if="currentSection !== 'settings' && currentSection !== 'dashboard'" class="project-selector">
            <select v-model="selectedProjectId" class="project-select">
              <option :value="null">Select Project...</option>
              <option
                v-for="project in projectsStore.items"
                :key="project.id"
                :value="project.id"
              >
                {{ project.name }}
              </option>
            </select>
          </div>

          <!-- User Menu -->
          <div class="user-menu-container">
            <button class="user-button" @click="showUserMenu = !showUserMenu">
              <span class="user-avatar">{{ authStore.currentAdmin?.displayName?.[0]?.toUpperCase() }}</span>
              <span class="user-name">{{ authStore.currentAdmin?.displayName }}</span>
            </button>
            
            <div v-if="showUserMenu" class="user-menu-dropdown">
              <div class="user-info">
                <div class="user-email">{{ authStore.currentAdmin?.displayName }}</div>
                <div class="user-role">{{ authStore.currentAdmin?.roles?.join(', ') }}</div>
              </div>
              <div class="menu-divider"></div>
              <button @click="router.push({ name: 'settings.profile' }); showUserMenu = false" class="menu-item">
                Profile
              </button>
              <button @click="handleLogout" class="menu-item">
                Logout
              </button>
            </div>
          </div>

          <!-- Mobile Menu Toggle -->
          <button class="mobile-menu-toggle" @click="showMobileMenu = !showMobileMenu">
            <Menu :size="24" />
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Navigation -->
    <div v-if="showMobileMenu" class="mobile-nav">
      <button
        v-for="section in sections"
        :key="section.id"
        :class="['mobile-nav-item', { active: currentSection === section.id }]"
        @click="navigateToSection(section.id)"
      >
        <component :is="section.icon" class="icon" :size="20" />
        <span class="label">{{ section.label }}</span>
      </button>
    </div>

    <!-- Main Content Area -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

/* Top Bar */
.top-bar {
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.top-bar-content {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  max-width: 1920px;
  margin: 0 auto;
}

.brand {
  margin-right: 48px;
}

.brand h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

/* Main Navigation */
.main-nav {
  display: flex;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #333;
}

.nav-item.active {
  background: #e3f2fd;
  color: #1976d2;
}

.nav-item .icon {
  flex-shrink: 0;
}

/* Top Bar Actions */
.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.project-selector {
  position: relative;
}

.project-select {
  padding: 8px 32px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  min-width: 200px;
}

.project-select:focus {
  outline: none;
  border-color: #1976d2;
}

/* User Menu */
.user-menu-container {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 6px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.user-button:hover {
  border-color: #1976d2;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1976d2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.user-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  z-index: 1000;
}

.user-info {
  padding: 12px 16px;
}

.user-email {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.user-role {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  text-transform: uppercase;
}

.menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 8px 0;
}

.menu-item {
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
}

/* Mobile Menu */
.mobile-menu-toggle {
  display: none;
  padding: 8px;
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  color: #333;
}

.mobile-nav {
  display: none;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 12px;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-nav-item:hover {
  background: #f5f5f5;
  color: #333;
}

.mobile-nav-item.active {
  background: #e3f2fd;
  color: #1976d2;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1920px;
  width: 100%;
  margin: 0 auto;
}

/* Responsive */
@media (max-width: 968px) {
  .main-nav {
    display: none;
  }

  .mobile-menu-toggle {
    display: block;
  }

  .mobile-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .project-select {
    min-width: 150px;
  }

  .user-name {
    display: none;
  }
}

@media (max-width: 640px) {
  .brand h1 {
    font-size: 16px;
  }

  .top-bar-content {
    padding: 0 16px;
  }

  .main-content {
    padding: 16px;
  }

  .project-selector {
    display: none;
  }
}
</style>
