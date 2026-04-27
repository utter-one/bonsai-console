import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Component } from 'vue'

export interface MenuItem {
    name: string
    label: string
    icon?: Component
    experimental?: boolean
    divider?: boolean
}

export const useLayoutStore = defineStore('layout', () => {
    const sidebarTitle = ref('')
    const sidebarItems = ref<MenuItem[]>([])
    const sidebarOwnerId = ref<string | null>(null)

    function setSidebar(title: string, items: MenuItem[], ownerId: string) {
        sidebarTitle.value = title
        sidebarItems.value = items
        sidebarOwnerId.value = ownerId
    }

    function clearSidebar(ownerId: string) {
        if (sidebarOwnerId.value === ownerId) {
            sidebarTitle.value = ''
            sidebarItems.value = []
            sidebarOwnerId.value = null
        }
    }

    return {
        sidebarTitle,
        sidebarItems,
        sidebarOwnerId,
        setSidebar,
        clearSidebar
    }
})
