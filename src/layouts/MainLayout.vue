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
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Top Navigation Bar -->
    <header class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-[100]">
      <div class="flex items-center px-6 h-16 max-w-[1920px] mx-auto">
        <!-- Logo & Brand -->
        <div class="mr-12">
          <h1 class="m-0 text-xl font-semibold text-gray-900">Nexus Admin</h1>
        </div>

        <!-- Main Navigation -->
        <nav class="flex gap-1 flex-1 md:flex hidden">
          <button
            v-for="section in sections"
            :key="section.id"
            :class="[
              'flex items-center gap-2 px-4 py-2 border-none bg-transparent cursor-pointer rounded-md text-sm font-medium transition-all',
              currentSection === section.id 
                ? 'bg-blue-50 text-primary-500' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            ]"
            @click="navigateToSection(section.id)"
          >
            <component :is="section.icon" class="flex-shrink-0" :size="18" />
            <span>{{ section.label }}</span>
          </button>
        </nav>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-4 ml-auto">
          <!-- Project Selector (only show if not in settings) -->
          <div v-if="currentSection !== 'settings' && currentSection !== 'dashboard'" class="relative sm:block hidden">
            <select 
              v-model="selectedProjectId" 
              class="px-3 py-2 pr-8 border border-gray-300 rounded-md bg-white text-sm cursor-pointer min-w-[200px] focus:outline-none focus:border-primary-500"
            >
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
          <div class="relative">
            <button 
              class="flex items-center gap-2 px-3 py-1.5 pl-1.5 border border-gray-300 rounded-full bg-white cursor-pointer transition-all hover:border-primary-500"
              @click="showUserMenu = !showUserMenu"
            >
              <span class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold text-sm">
                {{ authStore.currentAdmin?.displayName?.[0]?.toUpperCase() }}
              </span>
              <span class="text-sm font-medium text-gray-900 sm:inline hidden">
                {{ authStore.currentAdmin?.displayName }}
              </span>
            </button>
            
            <div 
              v-if="showUserMenu" 
              class="absolute top-[calc(100%+0.5rem)] right-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[220px] z-[1000]"
            >
              <div class="p-3">
                <div class="text-sm font-medium text-gray-900">{{ authStore.currentAdmin?.displayName }}</div>
                <div class="text-xs text-gray-600 mt-1 uppercase">{{ authStore.currentAdmin?.roles?.join(', ') }}</div>
              </div>
              <div class="h-px bg-gray-200 my-2"></div>
              <button 
                @click="router.push({ name: 'settings.profile' }); showUserMenu = false" 
                class="w-full px-4 py-2.5 border-none bg-transparent text-left text-sm text-gray-900 cursor-pointer transition-colors hover:bg-gray-100"
              >
                Profile
              </button>
              <button 
                @click="handleLogout" 
                class="w-full px-4 py-2.5 border-none bg-transparent text-left text-sm text-gray-900 cursor-pointer transition-colors hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>

          <!-- Mobile Menu Toggle -->
          <button 
            class="p-2 border-none bg-transparent text-2xl cursor-pointer text-gray-900 md:hidden block"
            @click="showMobileMenu = !showMobileMenu"
          >
            <Menu :size="24" />
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Navigation -->
    <div 
      v-if="showMobileMenu" 
      class="md:hidden flex flex-col gap-1 bg-white border-b border-gray-200 p-3"
    >
      <button
        v-for="section in sections"
        :key="section.id"
        :class="[
          'flex items-center gap-3 w-full px-3 py-3 border-none bg-transparent text-left text-sm font-medium rounded-md cursor-pointer transition-all',
          currentSection === section.id 
            ? 'bg-blue-50 text-primary-500' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        ]"
        @click="navigateToSection(section.id)"
      >
        <component :is="section.icon" class="icon" :size="20" />
        <span>{{ section.label }}</span>
      </button>
    </div>

    <!-- Main Content Area -->
    <main class="flex-1 p-6 max-w-[1920px] w-full mx-auto">
      <RouterView />
    </main>
  </div>
</template>
