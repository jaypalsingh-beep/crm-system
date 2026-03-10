
<script setup lang="ts">
import { Clock } from 'lucide-vue-next'

const props = defineProps<{
  leads: any[]
}>()

const getDaysDiff = (dateString: string) => {
  const lastUpdate = new Date(dateString)
  return Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
}

const getStatusClass = (status: string) => {
  const s = status.toLowerCase().replace(/\s+/g, '-')
  return `status-${s}`
}
</script>

<template>
  <div class="card recent-activity" style="margin-top: 1.5rem; border-top: 3px solid var(--error);">
    <div class="table-header" style="justify-content: flex-start; gap: 1rem;">
      <h2 style="color: var(--error);">Stale Inquiries (No updates for 3+ days)</h2>
      <Clock style="color: var(--error); width: 20px;" />
    </div>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Last Update</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Assigned To</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lead in leads" :key="lead.id" @click="navigateTo(`/leads/${lead.id}`)" style="background: rgba(255, 0, 0, 0.02);">
            <td style="color: var(--error); font-weight: 500;">{{ getDaysDiff(lead.updated_at || lead.created_at) }} days ago</td>
            <td><strong>{{ lead.full_name }}</strong></td>
            <td>{{ lead.phone }}</td>
            <td><span class="badge" :class="getStatusClass(lead.status)">{{ lead.status }}</span></td>
            <td>{{ lead.profiles?.full_name || 'Unassigned' }}</td>
          </tr>
          <tr v-if="leads.length === 0">
            <td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">No stale inquiries found. Good job!</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
