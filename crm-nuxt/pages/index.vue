
<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

const { getLeads } = useLeads()
const { profile, user, loading: authLoading } = useAuth()

const leads = ref<any[]>([])
const loading = ref(true)

const fetchDashboardData = async () => {
  loading.value = true
  const { data, success } = await getLeads()
  if (success) {
    leads.value = data || []
  }
  loading.value = false
}

const stats = computed(() => {
  let pendingCondition = (l: any) => !['Booked', 'Payment Done', 'Not Interested', 'Resolved', 'Camp Completed'].includes(l.status)
  let wonCondition = (l: any) => ['Booked', 'Payment Done'].includes(l.status)

  let titles = {
    total: "Total Inquiries",
    pending: "Active Pipeline",
    won: "Leads Won"
  }

  if (profile.value && ['Refund Manager', 'Special Camp Manager'].includes((profile.value as any).role)) {
    titles.total = "Total Issues"
    titles.pending = "Pending Issues"
    titles.won = "Resolved Issues"
    wonCondition = (l: any) => l.status === 'Resolved'
  }

  const total = leads.value.length
  const pending = leads.value.filter(pendingCondition).length
  const won = leads.value.filter(wonCondition).length
  const urgent = leads.value.filter(l => l.status === 'Follow-up Needed').length

  return [
    { title: titles.total, value: total, icon: 'Users' },
    { title: titles.pending, value: pending, icon: 'Layers' },
    { title: titles.won, value: won, icon: 'CheckCircle' },
    { title: "Urgent Actions", value: urgent, icon: 'AlertCircle' }
  ]
})

const staleLeads = computed(() => {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  
  return leads.value.filter(l => {
    const lastUpdate = new Date(l.updated_at || l.created_at)
    const isActive = !['Booked', 'Payment Done', 'Not Interested', 'Resolved', 'Camp Completed'].includes(l.status)
    return isActive && lastUpdate < threeDaysAgo
  }).sort((a,b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime())
})

const recentLeads = computed(() => {
  return leads.value.slice(0, 5)
})

onMounted(() => {
  fetchDashboardData()
})

// Watch for auth changes to redirect if logged out
watch(user, (newUser) => {
  if (!newUser && !authLoading.value) {
    // Only redirect if we are SURE we are logged out
    // navigateTo('/login')
  }
})
</script>

<template>
  <div v-if="!loading" class="dashboard-view active">
    <!-- Header Summary -->
    <div class="summary-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
      <DashboardStatCard 
        v-for="s in stats" 
        :key="s.title" 
        :title="s.title" 
        :value="s.value" 
        :icon="s.icon" 
      />
    </div>

    <!-- Analytics Section -->
    <DashboardAnalyticsTables :leads="leads" />
    
    <!-- Stale Inquiries -->
    <DashboardStaleInquiries :leads="staleLeads" />
    
    <!-- Recent Inquiries -->
    <DashboardRecentInquiries :leads="recentLeads" />

    <!-- FAB for New Inquiry -->
    <NuxtLink to="/leads/new" class="fab-button" title="New Inquiry">
       <Plus style="width: 28px; height: 28px;" />
    </NuxtLink>
  </div>
  <div v-else class="loading-state">
    <div class="spinner"></div>
    <p>Preparing your dashboard...</p>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
  gap: 1rem;
}
.fab-button {
  position: fixed;
  bottom: 2.5rem;
  right: 2.5rem;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
  z-index: 2000;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.fab-button:hover {
  transform: scale(1.1) translateY(-5px);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.6);
  background: var(--primary-dark);
}
</style>
