<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore, useProjectsStore, useProjectSelectionStore, usePlaygroundStore, useSnapshotsStore } from '@/stores'
import { formatEnum, useContextualHelp, useVersionPoller } from '@/composables'
import {
  Search, LogOut, User, HelpCircle, Sparkles, ChevronDown, ChevronRight, Star, Menu, X,
  Home, DraftingCompass, TestTube2, Activity, Settings,
  Drama, Route, Target, Zap, ShieldCheck, Microchip, MemoryStick, BookOpen, Hammer, MessageSquareQuote, BookMarked,
  FlaskConical, Bot, ClipboardList, PlayCircle,
  MessageSquare, Users as UsersIcon, Bug, BarChart2, Hourglass,
  BriefcaseBusiness, Key, CloudCog, Globe, User as UserIcon, Gauge, Cpu,
  HeartPulse, History, ChartLine, BellRing, SlidersHorizontal, Stethoscope,
  Maximize2, Minus, ArchiveRestore,
} from 'lucide-vue-next'
import ProfileEditModal from '@/components/modals/ProfileEditModal.vue'
import SetupWizardModal from '@/components/modals/SetupWizardModal.vue'
import AboutModal from '@/components/modals/AboutModal.vue'
import SnapshotListModal from '@/components/modals/SnapshotListModal.vue'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import logoUrl from '@/assets/logo.svg'
import { getProjectColorHex } from '@/assets/projectColors'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const projectSelectionStore = useProjectSelectionStore()
const playgroundStore = usePlaygroundStore()
const snapshotsStore = useSnapshotsStore()

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
  if (path.startsWith('/testing')) return 'testing'
  return 'dashboard'
})

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

const isInEditOrDetailView = computed(() => {
  const routeName = route.name as string
  if (!routeName) return false

  const hasResourceId =
    !!route.params.agentId ||
    !!route.params.stageId ||
    !!route.params.classifierId ||
    !!route.params.globalActionId ||
    !!route.params.toolId ||
    !!route.params.transformerId ||
    !!route.params.conversationId ||
    !!route.params.userId ||
    !!route.params.auditLogId ||
    !!route.params.testerId ||
    !!route.params.scenarioId

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
const showSnapshotsModal = ref(false)
const projectSelectorRef = ref<HTMLElement | null>(null)
const mobileDrawerRef = ref<HTMLElement | null>(null)
const sidebarSearchQuery = ref('')
const collapsedGroups = ref<Set<string>>(new Set())
// Route renames for persisted favorites (old name → new name)
const FAVORITE_ROUTE_MIGRATION: Record<string, string> = {
  'administration.monitoring.health': 'system.health',
  'administration.monitoring.alerts': 'system.alerts',
  'administration.monitoring.providerCalls': 'system.providerCalls',
  'administration.monitoring.metrics': 'system.metrics',
  'administration.monitoring.config': 'system.config',
}

const favorites = ref<Set<string>>(
  new Set(
    (JSON.parse(localStorage.getItem('sidebar-favorites') || '[]') as string[]).map(
      (name) => FAVORITE_ROUTE_MIGRATION[name] ?? name
    )
  )
)

watch(favorites, (val: Set<string>) => {
  localStorage.setItem('sidebar-favorites', JSON.stringify([...val]))
}, { deep: true })

function handleDocumentClick(e: MouseEvent) {
  if (projectSelectorRef.value && !projectSelectorRef.value.contains(e.target as Node)) {
    showProjectDropdown.value = false
  }
}

function handleMobileMenuClose(e: MouseEvent) {
  if (mobileDrawerRef.value && !mobileDrawerRef.value.contains(e.target as Node)) {
    showMobileMenu.value = false
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

const selectedProjectId = computed({
  get: () => projectSelectionStore.selectedProjectId,
  set: (value) => projectSelectionStore.setSelectedProjectId(value)
})

onMounted(async () => {
  document.addEventListener('click', handleDocumentClick, true)
  document.addEventListener('click', handleMobileMenuClose, true)
  await projectsStore.fetchUnfilteredProjects()

  projectSelectionStore.validateSelectedProject(projectsStore.unfilteredProjects)

  if (route.params.projectId) {
    projectSelectionStore.setSelectedProjectId(route.params.projectId as string)
  }
})

watch(() => projectsStore.unfilteredProjects, (list) => {
  projectSelectionStore.validateSelectedProject(list)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick, true)
  document.removeEventListener('click', handleMobileMenuClose, true)
})

watch(() => route.params.projectId, (newProjectId) => {
  if (newProjectId) {
    projectSelectionStore.setSelectedProjectId(newProjectId as string)
  }
})

watch(() => projectSelectionStore.selectedProjectId, (newProjectId) => {
  if (newProjectId && currentSection.value === 'design') {
    if (route.name && String(route.name).startsWith('design.')) {
      router.push({ name: route.name, params: { ...route.params, projectId: newProjectId } })
    } else {
      router.push({ name: 'design.stages', params: { projectId: newProjectId } })
    }
  }
  if (newProjectId && currentSection.value === 'testing') {
    if (route.name && String(route.name).startsWith('testing.')) {
      router.push({ name: route.name as string, params: { ...route.params, projectId: newProjectId } })
    } else {
      router.push({ name: 'testing.playground', params: { projectId: newProjectId } })
    }
  }
  // Fetch snapshot count when project changes
  if (newProjectId) {
    snapshotsStore.fetchAll(newProjectId, { limit: 1 }).catch(() => { /* ignore */ })
  } else {
    snapshotsStore.items = []
    snapshotsStore.pagination = { total: 0, offset: 0, limit: null }
  }
})

watch(() => projectSelectionStore.selectedProject, (proj) => {
  if (!proj) return
  if (currentSection.value === 'testing' && route.name === 'testing.playground') {
    if (proj.archivedAt) {
      router.push({ name: 'dashboard' })
    } else if (route.params.projectId !== proj.id) {
      router.push({ name: 'testing.playground', params: { projectId: proj.id } })
    }
  }
})

watch(projectIsArchived, (archived) => {
  if (archived && currentSection.value === 'testing' && route.name === 'testing.playground') {
    router.push({ name: 'dashboard' })
  }
})

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

// --- Layout mode (wide / centered) ---

type LayoutMode = 'wide' | 'centered'
const layoutMode = ref<LayoutMode>((localStorage.getItem('layoutMode') as LayoutMode) || 'wide')

function toggleLayoutMode() {
  layoutMode.value = layoutMode.value === 'wide' ? 'centered' : 'wide'
}

watch(layoutMode, (val) => {
  localStorage.setItem('layoutMode', val)
})

const showLayoutToggle = ref(window.innerWidth > 1920)

function updateShowLayoutToggle() {
  showLayoutToggle.value = window.innerWidth > 1920
}

onMounted(() => window.addEventListener('resize', updateShowLayoutToggle))
onUnmounted(() => window.removeEventListener('resize', updateShowLayoutToggle))

// --- Sidebar navigation structure ---

interface SidebarItem {
  name: string
  label: string
  icon: any
  requiresProject?: boolean
}

interface SidebarGroup {
  id: string
  label: string
  icon: any
  items: SidebarItem[]
}

function navigateToItem(routeName: string, requiresProject?: boolean) {
  if (requiresProject && !selectedProjectId.value) return

  if (routeName === 'dashboard') {
    router.push({ name: 'dashboard' })
  } else if (requiresProject && selectedProjectId.value) {
    router.push({ name: routeName, params: { projectId: selectedProjectId.value } })
  } else {
    router.push({ name: routeName })
  }
  showMobileMenu.value = false
}

function isRouteActive(routeName: string): boolean {
  return route.matched.some(r => r.name === routeName)
}

function isGroupActive(groupId: string): boolean {
  return currentSection.value === groupId
}

const designItems: SidebarItem[] = [
  { name: 'design.agents', label: 'Agents', icon: Drama, requiresProject: true },
  { name: 'design.stages', label: 'Stages', icon: Route, requiresProject: true },
  { name: 'design.classifiers', label: 'Classifiers', icon: Target, requiresProject: true },
  { name: 'design.globalActions', label: 'Global Actions', icon: Zap, requiresProject: true },
  { name: 'design.guardrails', label: 'Guardrails', icon: ShieldCheck, requiresProject: true },
  { name: 'design.contextTransformers', label: 'Context Transformers', icon: Microchip, requiresProject: true },
  { name: 'design.globalMemory', label: 'Global Memory', icon: MemoryStick, requiresProject: true },
  { name: 'design.sampleCopies', label: 'Sample Copy', icon: MessageSquareQuote, requiresProject: true },
  { name: 'design.knowledge', label: 'Knowledge', icon: BookOpen, requiresProject: true },
  { name: 'design.tools', label: 'Tools', icon: Hammer, requiresProject: true },
  { name: 'design.quickPrompts', label: 'Quick Prompts', icon: BookMarked, requiresProject: true },
]

const testingItems: SidebarItem[] = [
  { name: 'testing.playground', label: 'Playground', icon: FlaskConical, requiresProject: true },
  { name: 'testing.testers', label: 'Testers', icon: Bot, requiresProject: true },
  { name: 'testing.scenarios', label: 'Scenarios', icon: ClipboardList, requiresProject: true },
  { name: 'testing.testRuns', label: 'Test Runs', icon: PlayCircle, requiresProject: true },
]

const monitorItems: SidebarItem[] = [
  { name: 'monitor.conversations', label: 'Conversations', icon: MessageSquare, requiresProject: true },
  { name: 'monitor.users', label: 'Users', icon: UsersIcon, requiresProject: true },
  { name: 'monitor.issues', label: 'Issues', icon: Bug },
  { name: 'monitor.deferredProcessing', label: 'Deferred Processing', icon: Hourglass, requiresProject: true },
  { name: 'monitor.analytics', label: 'Analytics', icon: BarChart2, requiresProject: true },
  { name: 'monitor.auditLogs', label: 'Audit Logs', icon: ClipboardList },
]

const adminItems = computed((): SidebarItem[] => {
  const canBenchmark = authStore.permissions.includes('benchmark:read')
  const items: SidebarItem[] = [
    { name: 'administration.projects', label: 'Projects', icon: BriefcaseBusiness },
    { name: 'administration.apiKeys', label: 'API Keys', icon: Key },
    { name: 'administration.operators', label: 'Operators', icon: UserIcon },
    { name: 'administration.providers', label: 'Providers', icon: CloudCog },
    { name: 'administration.environments', label: 'Environments', icon: Globe },
  ]
  if (canBenchmark) {
    items.push(
      { name: 'administration.benchmarkSuites', label: 'Benchmark Suites', icon: Gauge },
      { name: 'administration.benchmarkProviderConfigs', label: 'Benchmark Providers', icon: Cpu }
    )
  }
  return items
})

// Platform health & alerting — its own section, visible to operators only
const systemItems = computed((): SidebarItem[] =>
  authStore.permissions.includes('system:monitoring')
    ? [
        { name: 'system.health', label: 'System Health', icon: HeartPulse },
        { name: 'system.alerts', label: 'Alerts', icon: BellRing },
        { name: 'system.providerCalls', label: 'Provider Calls', icon: History },
        { name: 'system.metrics', label: 'Metrics', icon: ChartLine },
        { name: 'system.config', label: 'Monitoring Config', icon: SlidersHorizontal },
      ]
    : []
)

const sidebarGroups = computed((): SidebarGroup[] => {
  const groups: SidebarGroup[] = [
    { id: 'design', label: 'Design', icon: DraftingCompass, items: designItems },
    { id: 'testing', label: 'Testing', icon: TestTube2, items: testingItems },
    { id: 'monitor', label: 'Monitor', icon: Activity, items: monitorItems },
    { id: 'administration', label: 'Administration', icon: Settings, items: adminItems.value },
  ]
  if (systemItems.value.length) {
    groups.push({ id: 'system', label: 'System', icon: Stethoscope, items: systemItems.value })
  }
  return groups
})

const filteredGroups = computed(() => {
  const groups = sidebarGroups.value
  if (!sidebarSearchQuery.value) return groups
  const q = sidebarSearchQuery.value.toLowerCase()
  return groups.map(group => ({
    ...group,
    items: group.items.filter(item => item.label.toLowerCase().includes(q) || group.label.toLowerCase().includes(q))
  })).filter(group => group.items.length > 0 || group.label.toLowerCase().includes(q))
})

const favoriteItems = computed(() => {
  const allItems: (SidebarItem & { groupLabel: string; requiresProject?: boolean })[] = []
  for (const group of filteredGroups.value) {
    for (const item of group.items) {
      if (favorites.value.has(item.name)) {
        allItems.push({ ...item, groupLabel: group.label })
      }
    }
  }
  return allItems
})

function toggleGroup(groupId: string) {
  if (collapsedGroups.value.has(groupId)) {
    collapsedGroups.value.delete(groupId)
  } else {
    collapsedGroups.value.add(groupId)
  }
}

function isGroupCollapsed(groupId: string): boolean {
  return collapsedGroups.value.has(groupId)
}

function toggleFavorite(name: string, e: Event) {
  e.stopPropagation()
  if (favorites.value.has(name)) {
    favorites.value.delete(name)
  } else {
    favorites.value.add(name)
  }
}

function isFavorite(name: string): boolean {
  return favorites.value.has(name)
}

// Auto-expand active group
watch(currentSection, (section) => {
  if (section !== 'dashboard' && !isGroupCollapsed(section)) {
    // Already expanded, do nothing
  } else if (section !== 'dashboard') {
    collapsedGroups.value.delete(section)
  }
}, { immediate: true })
</script>

<template>
  <div class="h-screen flex items-stretch overflow-hidden bg-gray-100 dark:bg-gray-950" :class="layoutMode === 'centered' ? '' : ''">
    <div class="flex flex-row w-full overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-xl" :class="[layoutMode === 'centered' ? 'mx-auto max-w-ultra' : '']"
>

    <!-- Sidebar (desktop only) -->
    <aside class="w-[300px] flex-shrink-0 hidden lg:flex flex-col border-r border-gray-200 bg-white overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <!-- Sidebar Header -->
      <div class="h-12 flex items-center px-4 border-b border-gray-200 flex-shrink-0 dark:border-gray-700">
        <button
          @click="router.push({ name: 'dashboard' })"
          class="flex items-center gap-2.5 p-1 -ml-1 rounded-md transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <img :src="logoUrl" alt="Bonsai" class="h-7 w-7" />
          <span class="text-base font-semibold text-gray-900 dark:text-white hidden xl:block font-serif-heading">Bonsai Console</span>
        </button>
      </div>

      <!-- Search -->
      <div class="px-3 py-2 flex-shrink-0">
        <div class="relative">
          <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="sidebarSearchQuery"
            type="text"
            placeholder="Filter..."
            class="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-gray-200 bg-gray-50 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      <!-- Scrollable Navigation -->
      <nav class="flex-1 overflow-y-auto px-2 pb-3">
        <!-- Dashboard -->
        <button
          :class="[
            'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md border-none cursor-pointer transition-all text-left mb-1',
            currentSection === 'dashboard'
              ? 'text-primary-600 bg-primary-50 font-medium dark:bg-primary-900/30 dark:text-primary-400'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          ]"
          @click="router.push({ name: 'dashboard' })"
        >
          <Home :size="16" class="flex-shrink-0 opacity-70" />
          <span class="flex-1 truncate">Dashboard</span>
        </button>

        <div class="h-px mx-2 my-2 bg-gray-100 dark:bg-gray-700" />

        <!-- Favorites -->
        <template v-if="favoriteItems.length > 0 && !sidebarSearchQuery">
          <div class="px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-500">Starred</div>
          <template v-for="item in favoriteItems" :key="'fav-' + item.name">
            <button
              :class="[
                'w-full flex items-center gap-2 px-2 py-1 text-sm rounded-md border-none cursor-pointer transition-all text-left',
                isRouteActive(item.name)
                  ? 'text-primary-600 bg-primary-50 font-medium dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              ]"
              @click="navigateToItem(item.name, item.requiresProject)"
            >
              <component :is="item.icon" :size="16" class="flex-shrink-0 opacity-70" />
              <span class="flex-1 truncate">{{ item.label }}</span>
              <span
                class="p-0.5 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                @click="(e) => toggleFavorite(item.name, e)"
              >
                <Star :size="12" class="fill-primary-400 text-primary-400" />
              </span>
            </button>
          </template>
          <div class="h-px mx-2 my-2 bg-gray-100 dark:bg-gray-700" />
        </template>

        <!-- Groups -->
        <template v-for="group in filteredGroups" :key="group.id">
          <!-- Group Header -->
          <button
            class="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold rounded-md border-none cursor-pointer transition-all text-left uppercase tracking-wider"
            :class="isGroupActive(group.id) ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'"
            @click="toggleGroup(group.id)"
          >
            <component :is="group.icon" :size="14" class="flex-shrink-0 opacity-70" />
            <span class="flex-1 truncate">{{ group.label }}</span>
            <ChevronDown v-if="!isGroupCollapsed(group.id)" :size="12" class="flex-shrink-0 opacity-50" />
            <ChevronRight v-else :size="12" class="flex-shrink-0 opacity-50" />
          </button>

          <!-- Group Items -->
          <template v-if="!isGroupCollapsed(group.id)">
            <template v-for="item in group.items" :key="item.name">
              <button
              :class="[
                    'w-full flex items-center gap-2 pl-8 pr-2 py-1 text-sm rounded-md border-none cursor-pointer transition-all text-left',
                    isRouteActive(item.name)
                      ? 'text-primary-600 bg-primary-50 font-medium dark:bg-primary-900/30 dark:text-primary-400'
                      : item.requiresProject && !selectedProjectId
                        ? 'opacity-40 text-gray-700 dark:text-gray-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  ]"
                  :disabled="item.requiresProject && !selectedProjectId"
                  @click="navigateToItem(item.name, item.requiresProject)"
                >
                  <component :is="item.icon" :size="16" class="flex-shrink-0 opacity-70" />
                  <span class="flex-1 truncate min-w-0">{{ item.label }}</span>
                  <span
                    v-if="!sidebarSearchQuery"
                    class="p-0.5 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0"
                    :class="isFavorite(item.name) ? 'text-primary-400' : 'text-gray-300 dark:text-gray-600'"
                    @click="(e) => toggleFavorite(item.name, e)"
                  >
                    <Star :size="12" :class="isFavorite(item.name) ? 'fill-primary-400 text-primary-400' : ''" />
                  </span>
                </button>
            </template>
          </template>

          <div v-if="!isGroupCollapsed(group.id)" class="h-px mx-6 my-2 bg-gray-100 dark:bg-gray-700" />
        </template>
      </nav>
    </aside>

    <!-- Topbar + Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Topbar -->
      <header class="h-12 flex items-center px-4 gap-4 bg-white border-b border-gray-200 flex-shrink-0 dark:bg-gray-800 dark:border-gray-700">
        <!-- Mobile Menu Toggle -->
        <button
          @click="showMobileMenu = !showMobileMenu"
          class="p-2 -ml-1 rounded-md border-none bg-transparent cursor-pointer transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100 lg:hidden block dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
        >
          <Menu :size="20" />
        </button>

        <!-- Project Selector -->
        <div
 
          ref="projectSelectorRef"
          class="relative hidden lg:block"
        >
          <button
            type="button"
            :disabled="isProjectSelectorDisabled"
            class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm border-none cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            :class="{ 'cursor-not-allowed opacity-60': isProjectSelectorDisabled }"
            :title="projectSelectorDisabledTitle"
            @click="!isProjectSelectorDisabled && (showProjectDropdown = !showProjectDropdown)"
          >
            <span
              class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10 transition-colors"
              :style="projectPrimaryColorHex ? { backgroundColor: projectPrimaryColorHex } : { backgroundColor: 'transparent', boxShadow: 'none' }"
              :class="!projectPrimaryColorHex ? 'border border-dashed border-gray-300 dark:border-gray-600' : ''"
            />
            <span class="max-w-[480px] truncate text-gray-700 font-medium dark:text-gray-200">
              {{ projectSelectionStore.selectedProject?.name ?? 'Select Project' }}
            </span>
            <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown -->
          <div
            v-if="showProjectDropdown"
            class="absolute top-full left-0 mt-1 z-[200] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[240px] max-h-80 overflow-y-auto dark:bg-gray-800 dark:border-gray-700"
          >
            <button
              type="button"
              class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left border-none bg-transparent cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              @click="selectProject(null)"
            >
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-dashed border-gray-300 dark:border-gray-600" />
              <span>Select Project...</span>
            </button>
            <template v-if="projectsStore.activeProjects.length > 0">
              <button
                v-for="project in projectsStore.activeProjects"
                :key="project.id"
                type="button"
                class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left border-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                :class="selectedProjectId === project.id ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/20 dark:text-primary-300' : 'text-gray-900 dark:text-gray-200'"
                @click="selectProject(project.id)"
              >
                <span
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10"
                  :style="projectColorMap.get(project.id) ? { backgroundColor: projectColorMap.get(project.id)! } : {}"
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
                class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left border-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                :class="selectedProjectId === project.id ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/20 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'"
                @click="selectProject(project.id)"
              >
                <span
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10"
                  :style="projectColorMap.get(project.id) ? { backgroundColor: projectColorMap.get(project.id)! } : {}"
                />
                <span class="truncate">{{ project.name }}</span>
              </button>
            </template>
          </div>
        </div>

        <!-- Snapshot Button -->
        <button
          v-show="projectSelectionStore.selectedProjectId"
          type="button"
          @click="showSnapshotsModal = true"
          class="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm border-none cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
          title="Project Snapshots"
        >
          <ArchiveRestore :size="16" />
          <span class="font-medium">Snapshots</span>
        </button>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Right: Utilities -->
        <div class="flex items-center gap-1 flex-shrink-0">
          <DarkModeToggle />

          <button
            v-if="showLayoutToggle"
            @click="toggleLayoutMode"
            class="p-2 rounded-md border-none bg-transparent cursor-pointer transition-colors text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-blue-400 dark:hover:bg-gray-700"
            :title="layoutMode === 'wide' ? 'Switch to centered layout' : 'Switch to wide layout'"
          >
            <component :is="layoutMode === 'wide' ? Minus : Maximize2" :size="18" />
          </button>

          <a
            :href="helpUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 rounded-md border-none bg-transparent cursor-pointer transition-colors text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-blue-400 dark:hover:bg-gray-700"
            title="Help & Documentation"
          >
            <HelpCircle :size="18" />
          </a>

          <!-- User Avatar -->
          <div class="relative ml-1">
            <button
              class="flex items-center gap-2 p-1 rounded-md border-none bg-transparent cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="showUserMenu = !showUserMenu"
            >
              <span class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-medium text-sm">
                {{ authStore.currentOperator?.name?.[0]?.toUpperCase() }}
              </span>
            </button>

            <div
              v-if="showUserMenu"
              class="absolute top-full right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[220px] z-[1000] dark:bg-gray-800 dark:border-gray-700"
            >
              <div class="p-3">
                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ authStore.currentOperator?.name }}</div>
                <div class="text-xs text-gray-500 mt-0.5 dark:text-gray-400">{{ formattedRoles }}</div>
              </div>
              <div class="h-px bg-gray-100 dark:bg-gray-700"></div>
              <button
                @click="handleEditProfile"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left border-none bg-transparent cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                <User :size="16" />
                Edit Profile
              </button>
              <button
                @click="handleOpenWizard"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left border-none bg-transparent cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                <Sparkles :size="16" class="text-primary-500" />
                Setup Wizard
              </button>
              <button
                @click="handleOpenAbout"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left border-none bg-transparent cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
               About
               </button>
               <div class="h-px bg-gray-100 dark:bg-gray-700"></div>
              <button
                @click="handleLogout"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left border-none bg-transparent cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
              >
                <LogOut :size="16" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Update Banner -->
      <div
        v-if="updateAvailable"
        class="bg-amber-50 border-b border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 flex-shrink-0"
      >
        <div class="flex items-center justify-between gap-4 px-6 py-2">
          <p class="text-sm text-amber-800 dark:text-amber-300">
            <span class="font-semibold">A new version is available.</span>
            Please refresh now &mdash; continuing without refreshing may cause issues.
          </p>
          <button
            type="button"
            class="flex-shrink-0 px-3 py-1 text-sm font-medium rounded-md bg-amber-200 text-amber-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700 transition-colors"
            @click="reloadPage()"
          >
            Refresh now
          </button>
        </div>
      </div>

      <!-- Main Content Area -->
      <main class="flex-1 min-h-0 overflow-y-auto p-4">
        <RouterView />
      </main>
      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <Teleport to="body">
      <!-- Backdrop -->
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
        />
      </Transition>

      <!-- Drawer Panel -->
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
          ref="mobileDrawerRef"
          class="fixed inset-y-0 left-0 z-[210] w-full max-w-xs bg-white dark:bg-gray-800 flex flex-col overflow-hidden"
        >
          <!-- Drawer Header -->
          <div class="h-12 flex items-center px-4 border-b border-gray-200 flex-shrink-0 dark:border-gray-700">
            <button
              @click="router.push({ name: 'dashboard' }); showMobileMenu = false"
              class="flex items-center gap-2.5 p-1 -ml-1 rounded-md transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex-1 min-w-0"
            >
              <img :src="logoUrl" alt="Bonsai" class="h-7 w-7 flex-shrink-0" />
              <span class="text-base font-semibold text-gray-900 dark:text-white truncate font-serif-heading">Bonsai Console</span>
            </button>
            <button
              @click="showMobileMenu = false"
              class="p-2 -mr-1 rounded-md border-none bg-transparent cursor-pointer text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
            >
              <X :size="20" />
            </button>
          </div>

          <!-- Mobile Project Selector -->
          <div class="px-3 py-2 flex-shrink-0">
            <div ref="projectSelectorRef" class="relative">
              <button
                type="button"
                :disabled="isProjectSelectorDisabled"
                class="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md border border-gray-200 bg-gray-50 cursor-pointer transition-colors hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                :class="{ 'cursor-not-allowed opacity-60': isProjectSelectorDisabled }"
                :title="projectSelectorDisabledTitle"
                @click="!isProjectSelectorDisabled && (showProjectDropdown = !showProjectDropdown)"
              >
                <span
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10 transition-colors"
                  :style="projectPrimaryColorHex ? { backgroundColor: projectPrimaryColorHex } : { backgroundColor: 'transparent', boxShadow: 'none' }"
                  :class="!projectPrimaryColorHex ? 'border border-dashed border-gray-300 dark:border-gray-600' : ''"
                />
                <span class="flex-1 text-left truncate text-gray-700 font-medium dark:text-gray-200">
                  {{ projectSelectionStore.selectedProject?.name ?? 'Select Project' }}
                </span>
                <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown -->
              <div
                v-if="showProjectDropdown"
                class="absolute top-full left-0 right-0 mt-1 z-[300] bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-700"
              >
                <button
                  type="button"
                  class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left border-none bg-transparent cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  @click="selectProject(null)"
                >
                  <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-dashed border-gray-300 dark:border-gray-600" />
                  <span>Select Project...</span>
                </button>
                <template v-if="projectsStore.activeProjects.length > 0">
                  <button
                    v-for="project in projectsStore.activeProjects"
                    :key="project.id"
                    type="button"
                    class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left border-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    :class="selectedProjectId === project.id ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/20 dark:text-primary-300' : 'text-gray-900 dark:text-gray-200'"
                    @click="selectProject(project.id)"
                  >
                    <span
                      class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10"
                      :style="projectColorMap.get(project.id) ? { backgroundColor: projectColorMap.get(project.id)! } : {}"
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
                    class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left border-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    :class="selectedProjectId === project.id ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/20 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'"
                    @click="selectProject(project.id)"
                  >
                    <span
                      class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10"
                      :style="projectColorMap.get(project.id) ? { backgroundColor: projectColorMap.get(project.id)! } : {}"
                    />
                    <span class="truncate">{{ project.name }}</span>
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Search -->
          <div class="px-3 py-2 flex-shrink-0">
            <div class="relative">
              <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                v-model="sidebarSearchQuery"
                type="text"
                placeholder="Filter..."
                class="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-gray-200 bg-gray-50 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <!-- Scrollable Navigation -->
          <nav class="flex-1 overflow-y-auto px-2 pb-3">
            <!-- Dashboard -->
            <button
              :class="[
                'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md border-none cursor-pointer transition-all text-left mb-1',
                currentSection === 'dashboard'
                  ? 'text-primary-600 bg-primary-50 font-medium dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              ]"
              @click="showMobileMenu = false; router.push({ name: 'dashboard' })"
            >
              <Home :size="16" class="flex-shrink-0 opacity-70" />
              <span class="flex-1 truncate">Dashboard</span>
            </button>

            <div class="h-px mx-2 my-2 bg-gray-100 dark:bg-gray-700" />

            <!-- Favorites -->
            <template v-if="favoriteItems.length > 0 && !sidebarSearchQuery">
              <div class="px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-500">Starred</div>
              <template v-for="item in favoriteItems" :key="'fav-' + item.name">
                <button
                  :class="[
                    'w-full flex items-center gap-2 px-2 py-1 text-sm rounded-md border-none cursor-pointer transition-all text-left',
                    isRouteActive(item.name)
                      ? 'text-primary-600 bg-primary-50 font-medium dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  ]"
                  @click="navigateToItem(item.name, item.requiresProject)"
                >
                  <component :is="item.icon" :size="16" class="flex-shrink-0 opacity-70" />
                  <span class="flex-1 truncate">{{ item.label }}</span>
                  <span
                    class="p-0.5 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                    @click="(e) => toggleFavorite(item.name, e)"
                  >
                    <Star :size="12" class="fill-primary-400 text-primary-400" />
                  </span>
                </button>
              </template>
              <div class="h-px mx-2 my-2 bg-gray-100 dark:bg-gray-700" />
            </template>

            <!-- Groups -->
            <template v-for="group in filteredGroups" :key="'m-' + group.id">
              <!-- Group Header -->
              <button
                class="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold rounded-md border-none cursor-pointer transition-all text-left uppercase tracking-wider"
                :class="isGroupActive(group.id) ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'"
                @click="toggleGroup(group.id)"
              >
                <component :is="group.icon" :size="14" class="flex-shrink-0 opacity-70" />
                <span class="flex-1 truncate">{{ group.label }}</span>
                <ChevronDown v-if="!isGroupCollapsed(group.id)" :size="12" class="flex-shrink-0 opacity-50" />
                <ChevronRight v-else :size="12" class="flex-shrink-0 opacity-50" />
              </button>

              <!-- Group Items -->
              <template v-if="!isGroupCollapsed(group.id)">
                <template v-for="item in group.items" :key="'mi-' + item.name">
                  <button
                    :class="[
                      'w-full flex items-center gap-2 pl-8 pr-2 py-1 text-sm rounded-md border-none cursor-pointer transition-all text-left',
                      isRouteActive(item.name)
                        ? 'text-primary-600 bg-primary-50 font-medium dark:bg-primary-900/30 dark:text-primary-400'
                        : item.requiresProject && !selectedProjectId
                          ? 'opacity-40 text-gray-700 dark:text-gray-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    ]"
                    :disabled="item.requiresProject && !selectedProjectId"
                    @click="navigateToItem(item.name, item.requiresProject)"
                  >
                    <component :is="item.icon" :size="16" class="flex-shrink-0 opacity-70" />
                    <span class="flex-1 truncate min-w-0">{{ item.label }}</span>
                    <span
                      v-if="!sidebarSearchQuery"
                      class="p-0.5 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0"
                      :class="isFavorite(item.name) ? 'text-primary-400' : 'text-gray-300 dark:text-gray-600'"
                      @click="(e) => toggleFavorite(item.name, e)"
                    >
                      <Star :size="12" :class="isFavorite(item.name) ? 'fill-primary-400 text-primary-400' : ''" />
                    </span>
                  </button>
                </template>
              </template>

              <div v-if="!isGroupCollapsed(group.id)" class="h-px mx-6 my-2 bg-gray-100 dark:bg-gray-700" />
            </template>
          </nav>
        </div>
      </Transition>
    </Teleport>

    <!-- Modals -->
    <ProfileEditModal
      v-if="showProfileModal"
      @close="showProfileModal = false"
      @saved="showProfileModal = false"
    />

    <SetupWizardModal
      v-if="showWizard"
      @close="showWizard = false"
    />

    <AboutModal
      v-if="showAbout"
      @close="showAbout = false"
    />

    <SnapshotListModal
      v-if="showSnapshotsModal && projectSelectionStore.selectedProjectId"
      :project-id="projectSelectionStore.selectedProjectId"
      @close="showSnapshotsModal = false"
    />
  </div>
</template>
