<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore, useProjectsStore, useProjectSelectionStore, usePlaygroundStore, useLayoutStore } from '@/stores'
import { formatEnum, useContextualHelp, useVersionPoller } from '@/composables'
import { FlaskConical, Home, DraftingCompass, Activity, Settings, Menu, X, LogOut, User, HelpCircle, Sparkles } from 'lucide-vue-next'
import ProfileEditModal from '@/components/modals/ProfileEditModal.vue'
import SetupWizardModal from '@/components/modals/SetupWizardModal.vue'
import AboutModal from '@/components/modals/AboutModal.vue'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import type { Component } from 'vue'
import logoUrl from '@/assets/logo.svg'
import { getProjectColorHex } from '@/assets/projectColors'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const projectSelectionStore = useProjectSelectionStore()
const playgroundStore = usePlaygroundStore()
const layoutStore = useLayoutStore()

const { helpUrl } = useContextualHelp()
const { updateAvailable } = useVersionPoller()

function reloadPage() {
  window.location.reload()
}

const currentSection = computed(() => {
  const path = route.path
  if (path.startsWith('/design')) return 'design'
  if (path.startsWith('/monitor')) return 'monitor'
  if (path.startsWith('/administration')) return 'administration'
  if (path.startsWith('/playground')) return 'playground'
  return 'dashboard'
})

// determine when selected project is archived so we can adjust UI
const projectIsArchived = computed(() => !!projectSelectionStore.selectedProject?.archivedAt)

const isProjectSelectorDisabled = computed(() => {
  if (playgroundStore.isConversationActive) return true
  return isInEditOrDetailView.value
})

const projectSelectorDisabledTitle = computed(() => {
  if (playgroundStore.isConversationActive) return 'Cannot change project while a conversation is active'
  if (isInEditOrDetailView.value) return 'Cannot change project while editing or viewing details'
  return ''
})

// Check if we're in an edit or detail view where project selection should be disabled
const isInEditOrDetailView = computed(() => {
  const routeName = route.name as string
  if (!routeName) return false
  
  // Check for edit/create/detail routes by looking at route params
  const hasResourceId = 
    !!route.params.agentId ||
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
const showWizard = ref(false)
const showAbout = ref(false)
const showProjectDropdown = ref(false)
const projectSelectorRef = ref<HTMLElement | null>(null)

function handleDocumentClick(e: MouseEvent) {
  if (projectSelectorRef.value && !projectSelectorRef.value.contains(e.target as Node)) {
    showProjectDropdown.value = false
  }
}

const projectColorMap = computed(() => {
  const map = new Map<string, string | null>()
  for (const p of projectsStore.unfilteredProjects) {
    map.set(p.id, getProjectColorHex(p.metadata?.primaryColor))
  }
  return map
})

function selectProject(id: string | null) {
  selectedProjectId.value = id
  showProjectDropdown.value = false
}

// Local ref for the select element binding
const selectedProjectId = computed({
  get: () => projectSelectionStore.selectedProjectId,
  set: (value) => projectSelectionStore.setSelectedProjectId(value)
})

// Load projects on mount
onMounted(async () => {
  document.addEventListener('click', handleDocumentClick, true)
  await projectsStore.fetchUnfilteredProjects()
  
  // Validate that the saved project still exists
  projectSelectionStore.validateSelectedProject(projectsStore.unfilteredProjects)
  
  // Set selectedProjectId from route if present (route takes priority)
  if (route.params.projectId) {
    projectSelectionStore.setSelectedProjectId(route.params.projectId as string)
  }
})

// Keep selection in sync with the master project list – clears if current
watch(() => projectsStore.unfilteredProjects, (list) => {
  projectSelectionStore.validateSelectedProject(list)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick, true)
})

// Watch route changes to update selected project
watch(() => route.params.projectId, (newProjectId) => {
  if (newProjectId) {
    projectSelectionStore.setSelectedProjectId(newProjectId as string)
  }
})

// Watch project selector changes (only design nav here; playground handled separately)
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
  }
})

// watch the full project object so we know its archived status before routing playground
watch(() => projectSelectionStore.selectedProject, (proj) => {
  if (!proj) return
  if (currentSection.value === 'playground') {
    if (proj.archivedAt) {
      router.push({ name: 'dashboard' })
    } else if (route.params.projectId !== proj.id) {
      router.push({ name: 'playground', params: { projectId: proj.id } })
    }
  }
})

// watch computed archived flag as a fallback
watch(projectIsArchived, (archived) => {
  if (archived && currentSection.value === 'playground') {
    router.push({ name: 'dashboard' })
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
     // block playground navigation if the project is archived
     if (projectIsArchived.value) {
       return
     }
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

function handleOpenWizard() {
  showWizard.value = true
  showUserMenu.value = false
}

function handleOpenAbout() {
  showAbout.value = true
  showUserMenu.value = false
}

const formattedRoles = computed(() => {
  return authStore.currentOperator?.roles?.map(formatEnum).join(', ') || ''
})

const projectPrimaryColorHex = computed(() => {
  return getProjectColorHex(projectSelectionStore.selectedProject?.metadata?.primaryColor)
})

// Sections for navigation. playground should be hidden when an archived project is selected
const sections = computed((): Array<{ id: string; label: string; icon: Component }> => {
  const list = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'design', label: 'Design', icon: DraftingCompass },
  ]

  // only show playground if project is not archived
  if (!projectIsArchived.value) {
    list.push({ id: 'playground', label: 'Playground', icon: FlaskConical })
  }

  list.push(
    { id: 'monitor', label: 'Monitor', icon: Activity },
    { id: 'administration', label: 'Administration', icon: Settings }
  )
  return list
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Top Navigation Bar -->
    <header class="bg-white shadow-sm sticky top-0 z-[100] dark:bg-gray-800">
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
          <div class="flex items-center gap-2">
            <img :src="logoUrl" alt="Bonsai Console" class="h-8 w-8" />
            <h1 class="m-0 text-xl font-semibold text-gray-900 dark:text-white">Bonsai&nbsp;Console</h1>
          </div>
        </div>

        <!-- Main Navigation -->
        <nav class="gap-1 flex-1 md:flex hidden">
          <button
            v-for="section in sections"
            :key="section.id"
            :class="[
              'flex items-center gap-2 px-3 py-2 border-none bg-transparent cursor-pointer rounded-md text-sm font-medium transition-all',
              currentSection === section.id 
                ? 'bg-blue-50 text-primary-500 dark:bg-gray-700 dark:text-primary-400' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
            ]"
            :title="section.label"
            @click="navigateToSection(section.id)"
          >
            <component :is="section.icon" class="flex-shrink-0" :size="18" />
            <span class="xl:inline hidden">{{ section.label }}</span>
          </button>
        </nav>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-4 ml-auto">
          <!-- Project Selector (only show if not in administration) -->
          <div
            v-if="currentSection !== 'administration'"
            ref="projectSelectorRef"
            class="relative sm:block hidden"
          >
            <!-- Trigger button -->
            <button
              type="button"
              :disabled="isProjectSelectorDisabled"
              :class="[
                'flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm min-w-[160px] max-w-[260px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 w-full',
                isProjectSelectorDisabled
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer hover:border-primary-500 dark:hover:border-primary-400'
              ]"
              :title="projectSelectorDisabledTitle"
              @click="!isProjectSelectorDisabled && (showProjectDropdown = !showProjectDropdown)"
            >
              <span
                class="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10 transition-colors"
                :style="projectPrimaryColorHex ? { backgroundColor: projectPrimaryColorHex } : { backgroundColor: 'transparent', boxShadow: 'none' }"
                :class="!projectPrimaryColorHex ? 'border border-dashed border-gray-300 dark:border-gray-600' : ''"
              />
              <span class="flex-1 text-left truncate text-gray-700 dark:text-gray-200">
                {{ projectSelectionStore.selectedProject?.name ?? 'Select Project...' }}
              </span>
              <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown panel -->
            <div
              v-if="showProjectDropdown"
              class="absolute top-[calc(100%+4px)] right-0 z-[200] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[220px] max-h-80 overflow-y-auto dark:bg-gray-800 dark:border-gray-700"
            >
              <button
                type="button"
                class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                @click="selectProject(null)"
              >
                <span class="w-3 h-3 rounded-full flex-shrink-0 border border-dashed border-gray-300 dark:border-gray-600" />
                <span>Select Project...</span>
              </button>

              <template v-if="projectsStore.activeProjects.length > 0">
                <button
                  v-for="project in projectsStore.activeProjects"
                  :key="project.id"
                  type="button"
                  :class="[
                    'flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700',
                    selectedProjectId === project.id
                      ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/20 dark:text-primary-300'
                      : 'text-gray-900 dark:text-gray-200'
                  ]"
                  @click="selectProject(project.id)"
                >
                  <span
                    class="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10"
                    :style="projectColorMap.get(project.id) ? { backgroundColor: projectColorMap.get(project.id)! } : { backgroundColor: 'transparent', outline: '1px dashed #9ca3af', outlineOffset: '0px', boxShadow: 'none' }"
                  />
                  <span class="truncate">{{ project.name }}</span>
                </button>
              </template>

              <template v-if="projectsStore.archivedProjects.length > 0">
                <div class="px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 mt-1 pt-2">Archived</div>
                <button
                  v-for="project in projectsStore.archivedProjects"
                  :key="project.id"
                  type="button"
                  :class="[
                    'flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700',
                    selectedProjectId === project.id
                      ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/20 dark:text-primary-300'
                      : 'text-gray-500 dark:text-gray-400'
                  ]"
                  @click="selectProject(project.id)"
                >
                  <span
                    class="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10"
                    :style="projectColorMap.get(project.id) ? { backgroundColor: projectColorMap.get(project.id)! } : { backgroundColor: 'transparent', outline: '1px dashed #9ca3af', outlineOffset: '0px', boxShadow: 'none' }"
                  />
                  <span class="truncate">{{ project.name }}</span>
                </button>
              </template>
            </div>
          </div>

          <!-- Help -->
          <a
            :href="helpUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 border-none bg-transparent text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
            title="Help & Documentation"
          >
            <HelpCircle :size="20" />
          </a>

          <!-- Dark Mode Toggle -->
          <DarkModeToggle />

          <!-- User Menu -->
          <div class="relative">
            <button 
              class="flex items-center md:gap-2 gap-1 md:px-3 px-1.5 py-1.5 pl-1.5 border border-gray-300 rounded-full bg-white cursor-pointer transition-all hover:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-primary-400"
              @click="showUserMenu = !showUserMenu"
            >
              <span class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold text-sm">
                {{ authStore.currentOperator?.name?.[0]?.toUpperCase() }}
              </span>
              <span class="text-sm font-medium text-gray-900 sm:inline hidden dark:text-gray-200">
                {{ authStore.currentOperator?.name }}
              </span>
            </button>
            
            <div 
              v-if="showUserMenu" 
              class="absolute top-[calc(100%+0.5rem)] right-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[220px] z-[1000] dark:bg-gray-800 dark:border-gray-700"
            >
              <div class="p-3">
                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ authStore.currentOperator?.name }}</div>
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
                @click="handleOpenWizard" 
                class="w-full px-4 py-2.5 border-none bg-transparent text-left text-sm text-gray-900 cursor-pointer transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Sparkles :size="14" class="text-primary-500" />
                Setup Wizard
              </button>
              <button 
                @click="handleOpenAbout" 
                class="w-full px-4 py-2.5 border-none bg-transparent text-left text-sm text-gray-900 cursor-pointer transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                About
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
            <div class="flex items-center gap-2">
              <img :src="logoUrl" alt="Bonsai Console" class="h-8 w-8 dark:invert" />
              <h2 class="text-xl font-semibold text-gray-900 m-0 dark:text-white">Bonsai Console</h2>
            </div>
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
                v-for="project in projectsStore.activeProjects"
                :key="project.id"
                :value="project.id"
              >
                {{ project.name }}
              </option>
              <template v-if="projectsStore.archivedProjects.length > 0">
                <option disabled value="">── Archived Projects ──</option>
                <option
                  v-for="project in projectsStore.archivedProjects"
                  :key="project.id"
                  :value="project.id"
                >
                  {{ project.name }} (archived)
                </option>
              </template>
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
                  <span v-if="item.experimental" class="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                    <FlaskConical class="w-3 h-3" />
                  </span>
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
                {{ authStore.currentOperator?.name?.[0]?.toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 truncate dark:text-white">{{ authStore.currentOperator?.name }}</div>
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
              @click="handleOpenWizard" 
              class="flex items-center gap-3 w-full px-3 py-2.5 border-none bg-transparent text-left text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Sparkles :size="20" class="text-primary-500" />
              <span>Setup Wizard</span>
            </button>
            <button 
              @click="handleOpenAbout" 
              class="flex items-center gap-3 w-full px-3 py-2.5 border-none bg-transparent text-left text-sm font-medium text-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span>About</span>
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

    <!-- Update Available Banner -->
    <div
      v-if="updateAvailable"
      class="bg-amber-50 border-b border-amber-200 dark:bg-amber-900/20 dark:border-amber-700"
    >
      <div class="flex items-center justify-between gap-4 px-6 py-2.5 max-w-[1920px] mx-auto">
        <p class="text-sm text-amber-800 dark:text-amber-300">
          <span class="font-semibold">A new version of Bonsai Console is available.</span>
          Please refresh now &mdash; continuing without refreshing may cause buttons and actions to stop working.
        </p>
        <button
          type="button"
          class="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md bg-amber-200 text-amber-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700 transition-colors"
          @click="reloadPage()"
        >
          Refresh now
        </button>
      </div>
    </div>

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

    <!-- Setup Wizard Modal -->
    <SetupWizardModal
      v-if="showWizard"
      @close="showWizard = false"
    />

    <!-- About Modal -->
    <AboutModal
      v-if="showAbout"
      @close="showAbout = false"
    />
  </div>
</template>
