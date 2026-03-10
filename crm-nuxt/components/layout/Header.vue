
<script setup lang="ts">
const { profile, signOut } = useAuth()
const route = useRoute()

const pageTitle = computed(() => {
  const path = route.path
  if (path === '/') return 'Dashboard'
  if (path.startsWith('/leads')) return 'Leads'
  if (path === '/users') return 'Team & Assignments'
  if (path === '/reports') return 'Insights'
  if (path === '/requests') return 'Lead Requests'
  if (path === '/settings') return 'Field Configuration'
  return 'CRM Pro'
})
</script>

<template>
  <header class="top-header">
    <div class="header-left">
      <h1>{{ pageTitle }}</h1>
    </div>
    <div class="header-right">
      <button class="btn btn-secondary btn-sm" @click="signOut">Logout</button>
      <div class="user-profile">
        <span class="user-name">{{ profile?.full_name }}</span>
        <div class="user-avatar">{{ profile?.full_name?.substring(0, 2).toUpperCase() }}</div>
      </div>
    </div>
  </header>
</template>
