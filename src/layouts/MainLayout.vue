<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore, useProjectsStore, useProjectSelectionStore, useLayoutStore } from '@/stores'
import { formatEnum } from '@/composables'
import { FlaskConical, Home, DraftingCompass, Activity, Settings, Menu, X, LogOut, User } from 'lucide-vue-next'
import ProfileEditModal from '@/components/modals/ProfileEditModal.vue'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import type { Component } from 'vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const projectSelectionStore = useProjectSelectionStore()
const layoutStore = useLayoutStore()

const currentSection = computed(() => {
  const path = route.path
  if (path.startsWith('/design')) return 'design'
  if (path.startsWith('/monitor')) return 'monitor'
  if (path.startsWith('/administration')) return 'administration'
  if (path.startsWith('/playground')) return 'playground'
  return 'dashboard'
})

// Check if we're in an edit or detail view where project selection should be disabled
const isInEditOrDetailView = computed(() => {
  const routeName = route.name as string
  if (!routeName) return false
  
  // Check for edit/create/detail routes by looking at route params
  const hasResourceId = 
    !!route.params.personaId ||
    !!route.params.stageId ||
    !!route.params.classifierId ||
    !!route.params.globalActionId ||
    !!route.params.toolId ||
    !!route.params.transformerId ||
    !!route.params.conversationId ||
    !!route.params.userId ||
    !!route.params.auditLogId
  
  // Also check if route name contains 'edit', 'create', or 'detail'
  const isEditCreateOrDetail = 
    routeName.includes('.edit') || 
    routeName.includes('.create') || 
    routeName.includes('Detail')
  
  return hasResourceId || isEditCreateOrDetail
})

const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const showProfileModal = ref(false)

// Local ref for the select element binding
const selectedProjectId = computed({
  get: () => projectSelectionStore.selectedProjectId,
  set: (value) => projectSelectionStore.setSelectedProjectId(value)
})

// Load projects on mount
onMounted(async () => {
  await projectsStore.fetchAll({ offset: 0, limit: 100 })
  
  // Validate that the saved project still exists
  projectSelectionStore.validateSelectedProject(projectsStore.items)
  
  // Set selectedProjectId from route if present (route takes priority)
  if (route.params.projectId) {
    projectSelectionStore.setSelectedProjectId(route.params.projectId as string)
  }
})

// Watch route changes to update selected project
watch(() => route.params.projectId, (newProjectId) => {
  if (newProjectId) {
    projectSelectionStore.setSelectedProjectId(newProjectId as string)
  }
})

// Watch project selector changes
watch(() => projectSelectionStore.selectedProjectId, (newProjectId) => {
  if (newProjectId && currentSection.value === 'design') {
    // Only auto-navigate if we're in the design section
    if (route.name && String(route.name).startsWith('design.')) {
      // If we're already in a design view, navigate to the same view with the new project
      router.push({ name: route.name, params: { ...route.params, projectId: newProjectId } })
    } else {
      // Otherwise navigate to stages view of the selected project
      router.push({ name: 'design.stages', params: { projectId: newProjectId } })
    }
  } else if (newProjectId && currentSection.value === 'playground') {
    // Navigate to playground with the new project
    router.push({ name: 'playground', params: { projectId: newProjectId } })
  }
})

function navigateToSection(section: string) {
  if (section === 'dashboard') {
    router.push({ name: 'dashboard' })
  } else if (section === 'design') {
    if (selectedProjectId.value) {
      // Navigate to design with the selected project
      router.push({ name: 'design.stages', params: { projectId: selectedProjectId.value } })
    } else {
       // Cannot go to design without a project usually, but let's default to design root if it exists, or prompting
       router.push({ name: 'design' })
    }
  } else if (section === 'playground') {
     if (selectedProjectId.value) {
        // Navigate to playground with the selected project
        router.push({ name: 'playground', params: { projectId: selectedProjectId.value } })
     } else {
        // Navigate to playground root (no project)
        router.push({ name: 'playground' })
     }
  } else {
    router.push({ name: section })
  }
  showMobileMenu.value = false
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}

function handleEditProfile() {
  showProfileModal.value = true
  showUserMenu.value = false
}

const formattedRoles = computed(() => {
  return authStore.currentAdmin?.roles?.map(formatEnum).join(', ') || ''
})

// Sections for navigation
const sections: Array<{ id: string; label: string; icon: Component }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'design', label: 'Design', icon: DraftingCompass },
  { id: 'playground', label: 'Playground', icon: FlaskConical },
  { id: 'monitor', label: 'Monitor', icon: Activity },
  { id: 'administration', label: 'Administration', icon: Settings },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Top Navigation Bar -->
    <header class="bg-white  shadow-sm sticky top-0 z-[100] dark:bg-gray-800 ">
      <div class="flex items-center px-6 h-16 max-w-[1920px] mx-auto">
        <!-- Mobile Menu Toggle -->
        <button 
          class="p-2 -ml-2 mr-2 border-none bg-transparent text-2xl cursor-pointer text-gray-900 md:hidden block hover:bg-gray-100 rounded-md dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
          @click="showMobileMenu = !showMobileMenu"
        >
          <Menu :size="24" />
        </button>

        <!-- Logo & Brand -->
        <div class="md:mr-12">
          <h1 class="m-0 text-xl font-semibold text-gray-900 dark:text-white">Bonsai Console</h1>
        </div>

        <!-- Main Navigation -->
        <nav class="flex gap-1 flex-1 md:flex hidden">
          <button
            v-for="section in sections"
            :key="section.id"
            :class="[
              'flex items-center gap-2 px-4 py-2 border-none bg-transparent cursor-pointer rounded-md text-sm font-medium transition-all',
              currentSection === section.id 
                ? 'bg-blue-50 text-primary-500 dark:bg-gray-700 dark:text-primary-400' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
            ]"
            @click="navigateToSection(section.id)"
          >
            <component :is="section.icon" class="flex-shrink-0" :size="18" />
            <span>{{ section.label }}</span>
          </button>
        </nav>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-4 ml-auto">
          <!-- Project Selector (only show if not in administration) -->
          <div v-if="currentSection !== 'administration' && currentSection !== 'dashboard'" class="relative sm:block hidden">
            <select 
              v-model="selectedProjectId" 
              :disabled="isInEditOrDetailView"
              :class="[
                'px-3 py-2 pr-8 border border-gray-300 rounded-md bg-white text-sm min-w-[200px] focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200',
                isInEditOrDetailView 
                  ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900' 
                  : 'cursor-pointer focus:border-primary-500 dark:focus:border-primary-400'
              ]"
              :title="isInEditOrDetailView ? 'Cannot change project while editing or viewing details' : ''"
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

          <!-- Dark Mode Toggle -->
          <DarkModeToggle />

          <!-- User Menu -->
          <div class="relative">
            <button 
              class="flex items-center md:gap-2 gap-1 md:px-3 px-1.5 py-1.5 pl-1.5 border border-gray-300 rounded-full bg-white cursor-pointer transition-all hover:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-primary-400"
              @click="showUserMenu = !showUserMenu"
            >
              <span class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold text-sm">
                {{ authStore.currentAdmin?.name?.[0]?.toUpperCase() }}
              </span>
              <span class="text-sm font-medium text-gray-900 sm:inline hidden dark:text-gray-200">
                {{ authStore.currentAdmin?.name }}
              </span>
            </button>
            
            <div 
              v-if="showUserMenu" 
              class="absolute top-[calc(100%+0.5rem)] right-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[220px] z-[1000] dark:bg-gray-800 dark:border-gray-700"
            >
              <div class="p-3">
                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ authStore.currentAdmin?.name }}</div>
                <div class="text-xs text-gray-600 mt-1 dark:text-gray-400">{{ formattedRoles }}</div>
              </div>
              <div class="h-px bg-gray-200 my-2 dark:bg-gray-700"></div>
              <button 
                @click="handleEditProfile" 
                class="w-full px-4 py-2.5 border-none bg-transparent text-left text-sm text-gray-900 cursor-pointer transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Edit Profile
              </button>
              <button 
                @click="handleLogout" 
                class="w-full px-4 py-2.5 border-none bg-transparent text-left text-sm text-gray-900 cursor-pointer transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>

    <!-- Mobile Navigation Sidebar -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity ease-linear duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity ease-linear duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div 
          v-if="showMobileMenu" 
          class="fixed inset-0 bg-gray-900/80 z-[200]" 
          @click="showMobileMenu = false"
        ></div>
      </Transition>

      <Transition
        enter-active-class="transition ease-in-out duration-300 transform"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition ease-in-out duration-300 transform"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
      >
        <div 
          v-if="showMobileMenu" 
          class="fixed inset-y-0 left-0 z-[210] w-full max-w-xs bg-white p-6 overflow-y-auto flex flex-col dark:bg-gray-800"
        >
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-xl font-semibold text-gray-900 m-0 dark:text-white">Bonsai Console</h2>
            <button 
              class="p-2 -mr-2 bg-transparent border-none text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              @click="showMobileMenu = false"
            >
              <X :size="24" />
            </button>
          </div>

          <!-- Mobile Project Selector -->
          <div v-if="currentSection !== 'administration' && currentSection !== 'dashboard'" class="mb-6">
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">Project</label>
            <select 
              v-model="selectedProjectId" 
              :disabled="isInEditOrDetailView"
              :class="[
                'w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200',
                isInEditOrDetailView 
                  ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-800' 
                  : 'cursor-pointer focus:border-primary-500 dark:focus:border-primary-400'
              ]"
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

          <nav class="flex-1 flex flex-col gap-1">
            <div v-for="section in sections" :key="section.id">
              <button
                :class="[
                  'flex items-center gap-3 w-full px-3 py-3 border-none bg-transparent text-left text-sm font-medium rounded-md cursor-pointer transition-all',
                  currentSection === section.id 
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                ]"
                @click="navigateToSection(section.id)"
              >
                <component :is="section.icon" class="flex-shrink-0" :size="20" />
                <span>{{ section.label }}</span>
              </button>

              <!-- Sidebar Items (Sub-menu) -->
              <div v-if="currentSection === section.id && layoutStore.sidebarItems.length > 0" class="pl-4 mt-1 flex flex-col gap-1 border-l-2 border-gray-100 ml-4 mb-2 dark:border-gray-700">
                <button
                  v-for="item in layoutStore.sidebarItems"
                  :key="item.name"
                  :class="[
                    'w-full flex items-center gap-3 px-3 py-2.5 border-none bg-transparent text-left text-sm font-medium rounded-md cursor-pointer transition-all',
                    route.name === item.name
                      ? 'text-primary-600 font-semibold dark:text-primary-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  ]"
                  @click="() => { router.push({ name: item.name }); showMobileMenu = false; }"
                >
                  <component v-if="item.icon" :is="item.icon" :size="16" class="flex-shrink-0 opacity-70" />
                  <span>{{ item.label }}</span>
                </button>
              </div>
            </div>
          </nav>

          <!-- Divider -->
          <div class="h-px bg-gray-200 my-6 dark:bg-gray-700"></div>

          <!-- User Section -->
          <div class="flex flex-col gap-2">
            <div class="px-3 py-2 flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold text-sm">
                {{ authStore.currentAdmin?.name?.[0]?.toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 truncate dark:text-white">{{ authStore.currentAdmin?.name }}</div>
                <div class="text-xs text-gray-500 truncate dark:text-gray-400">{{ formattedRoles }}</div>
              </div>
            </div>
            
            <button 
              @click="handleEditProfile" 
              class="flex items-center gap-3 w-full px-3 py-2.5 border-none bg-transparent text-left text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <User :size="20" />
              <span>Edit Profile</span>
            </button>
            <button 
              @click="handleLogout" 
              class="flex items-center gap-3 w-full px-3 py-2.5 border-none bg-transparent text-left text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <LogOut :size="20" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Main Content Area -->
    <main class="flex-1 min-h-0 p-6 max-w-[1920px] w-full mx-auto flex flex-col">
      <div class="flex-1 min-h-0 flex flex-col">
        <RouterView />
      </div>
    </main>

    <!-- Profile Edit Modal -->
    <ProfileEditModal 
      v-if="showProfileModal"
      @close="showProfileModal = false"
      @saved="showProfileModal = false"
    />
  </div>
</template>
