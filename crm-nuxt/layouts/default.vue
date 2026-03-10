
<script setup lang="ts">
const { user, profile, loading, checkUser } = useAuth()

onMounted(async () => {
  await checkUser()
})
</script>

<template>
  <div class="dashboard-container" :class="{ 'logged-in': user }">
    <ClientOnly>
      <LayoutSidebar v-if="user" />
      <main class="main-content">
        <LayoutHeader v-if="user" />
        <div v-if="loading" class="loading-overlay">
          <div class="spinner"></div>
        </div>
        <div v-else class="content-area">
          <slot />
        </div>
      </main>
    </ClientOnly>
  </div>
</template>

<style>
/* Global styles for the layout structure */
.loading-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 80px);
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border);
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Ensure active sections are visible */
.view-section.active, .dashboard-view.active, .leads-view.active {
  display: block !important;
}

.content-area {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .content-area {
    padding: 1.5rem 1rem;
  }
}
</style>
