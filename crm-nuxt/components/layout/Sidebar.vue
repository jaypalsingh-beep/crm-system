
<script setup lang="ts">
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  BarChart3, 
  ClipboardList, 
  Settings,
  Layers,
  Menu
} from 'lucide-vue-next'

const { profile, user } = useAuth()
const route = useRoute()

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/', page: 'dashboard-view' },
  { name: 'Leads', icon: Users, path: '/leads', page: 'leads-view' },
  { name: 'Team & Assignments', icon: UserPlus, path: '/users', page: 'users-view', id: 'nav-team' },
  { name: 'Insights', icon: BarChart3, path: '/reports', page: 'reports-view' },
  { name: 'Lead Requests', icon: ClipboardList, path: '/requests', page: 'lead-requests-view', id: 'nav-requests' },
  { name: 'Field Configuration', icon: Settings, path: '/settings', page: 'settings-view', id: 'nav-settings' },
]

const filteredMenu = computed(() => {
  // If no user, show nothing
  if (!user.value) return []
  
  // If profile not loaded yet, show basic items only
  if (!profile.value) {
    return menuItems.filter(item => !item.id)
  }

  // Admin/Manager logic
  return menuItems.filter(item => {
    if (profile.value.role === 'Executive') {
      return !['nav-team', 'nav-requests', 'nav-settings'].includes(item.id || '')
    }
    if (profile.value.role === 'Manager') {
      return !['nav-requests', 'nav-settings'].includes(item.id || '')
    }
    return true
  })
})

const isMobileMenuOpen = ref(false)
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <Layers class="brand-icon" style="color: var(--primary);" />
      <h2 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: var(--text-dark);">CRM Pro</h2>
      <button class="mobile-menu-btn" @click="toggleMobileMenu">
        <Menu />
      </button>
    </div>
    <nav class="sidebar-nav" :class="{ active: isMobileMenuOpen }">
      <ul>
        <li v-for="item in filteredMenu" :key="item.name">
          <NuxtLink :to="item.path" class="nav-item" :class="{ active: route.path === item.path }" @click="isMobileMenuOpen = false">
            <component :is="item.icon" class="nav-icon" />
            <span>{{ item.name }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
.router-link-active.nav-item {
  background: var(--bg-hover);
  color: var(--primary);
  border-left: 4px solid var(--primary);
}
</style>
