import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const sidebarCollapsed = ref<boolean>(localStorage.getItem('sidebarCollapsed') === 'true')
  const theme = ref<string>(localStorage.getItem('theme') || 'light')

  // Actions
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }

  const setTheme = (newTheme: string) => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
  }

  return {
    sidebarCollapsed,
    theme,
    toggleSidebar,
    setTheme
  }
})
