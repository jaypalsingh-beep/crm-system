
<script setup lang="ts">
import { Check, X, ClipboardList } from 'lucide-vue-next'

const { getLeadRequests, approveLeadRequest, rejectLeadRequest } = useLeads()

const requests = ref<any[]>([])
const loading = ref(true)

const loadRequests = async () => {
  const { data, success } = await getLeadRequests()
  if (success) requests.value = data || []
  loading.value = false
}

const handleApprove = async (req: any) => {
  if (confirm(`Approve request for ${req.phone}?`)) {
    const leadUpdates = {
      phone: req.phone,
      primary_event: req.primary_event,
      events_interested: req.events_interested
    }
    const { success } = await approveLeadRequest(req.id, leadUpdates)
    if (success) {
      requests.value = requests.value.filter(r => r.id !== req.id)
    }
  }
}

const handleReject = async (id: string) => {
  if (confirm('Reject this request?')) {
    const { success } = await rejectLeadRequest(id)
    if (success) {
      requests.value = requests.value.filter(r => r.id !== id)
    }
  }
}

onMounted(() => {
  loadRequests()
})
</script>

<template>
  <div class="lead-requests-view active">
    <section class="card table-card">
      <div class="table-header">
        <h2>Lead Requests</h2>
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Phone</th>
              <th>Requested Events</th>
              <th>Primary Event</th>
              <th>Requester</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in requests" :key="req.id">
              <td>{{ new Date(req.created_at).toLocaleDateString() }}</td>
              <td><strong>{{ req.phone }}</strong></td>
              <td>{{ (req.events_interested || []).join(', ') }}</td>
              <td>{{ req.primary_event }}</td>
              <td>{{ req.requester_name || 'Anonymous' }}</td>
              <td>
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn btn-success btn-sm" @click="handleApprove(req)"><Check /></button>
                  <button class="btn btn-danger btn-sm" @click="handleReject(req.id)"><X /></button>
                </div>
              </td>
            </tr>
            <tr v-if="requests.length === 0 && !loading">
              <td colspan="6" style="text-align:center; padding: 2rem;">No pending requests</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.btn-success { background: var(--success); color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; }
.btn-danger { background: var(--error); color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; }
</style>
