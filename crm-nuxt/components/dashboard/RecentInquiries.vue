
<script setup lang="ts">
import { Clock } from 'lucide-vue-next'

const props = defineProps<{
  leads: any[]
}>()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const getStatusClass = (status: string) => {
  const s = status.toLowerCase().replace(/\s+/g, '-')
  return `status-${s}`
}
</script>

<template>
  <div class="card recent-activity">
    <div class="table-header">
       <h2>Recent Inquiries</h2>
    </div>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Primary Event</th>
            <th>Status</th>
            <th>Assigned To</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lead in leads" :key="lead.id" @click="navigateTo(`/leads/${lead.id}`)">
            <td>{{ formatDate(lead.created_at) }}</td>
            <td><strong>{{ lead.full_name }}</strong></td>
            <td>{{ lead.primary_event }}</td>
            <td><span class="badge" :class="getStatusClass(lead.status)">{{ lead.status }}</span></td>
            <td>{{ lead.profiles?.full_name || 'Unassigned' }}</td>
          </tr>
          <tr v-if="leads.length === 0">
            <td colspan="5" style="text-align:center; padding: 2rem;">No entries found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
