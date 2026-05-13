import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
    const isDark = ref(localStorage.getItem('theme') === 'dark')

    function toggleTheme() {
        isDark.value = !isDark.value
    }

    function setTheme(dark: boolean) {
        isDark.value = dark
    }

    watch(isDark, (val) => {
        document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light')
        localStorage.setItem('theme', val ? 'dark' : 'light')
    }, { immediate: true })

    return {
        isDark,
        toggleTheme,
        setTheme
    }
})
