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
        if (val) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, { immediate: true })

    return {
        isDark,
        toggleTheme,
        setTheme
    }
})
