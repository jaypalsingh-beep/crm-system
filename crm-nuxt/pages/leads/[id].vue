
<script setup lang="ts">
import { ChevronLeft, Save, Trash2, Calendar, Phone, Mail, User } from 'lucide-vue-next'

const route = useRoute()
const leadId = route.params.id as string
const { getLeadById, updateLead } = useLeads()
const { getFormOptions } = useSettings()

const lead = ref<any>(null)
const options = ref<any>(null)
const loading = ref(true)
const saving = ref(false)

const loadLead = async () => {
  const [leadRes, optRes] = await Promise.all([
    getLeadById(leadId),
    getFormOptions()
  ])
  
  if (leadRes.success) {
    lead.value = leadRes.data
  }
  if (optRes.success) {
    options.value = optRes.data
  }
  loading.value = false
}

const handleSave = async () => {
  saving.value = true
  try {
    const { success, error } = await updateLead(leadId, lead.value)
    if (success) {
      alert('Lead updated successfully')
    } else {
      alert('Error: ' + error)
    }
  } finally {
    saving.value = false
  }
}

const addQuickNote = (note: string) => {
  if (lead.value) {
    lead.value.remarks = lead.value.remarks 
      ? lead.value.remarks + '\n- ' + note 
      : '- ' + note
  }
}

onMounted(() => {
  loadLead()
})
</script>

<template>
  <div v-if="!loading && lead" class="lead-detail-view">
    <div class="detail-header">
      <button class="btn btn-secondary" @click="navigateTo('/leads')">
        <ChevronLeft /> Back to List
      </button>
      <div class="detail-actions">
        <button class="btn btn-primary" @click="handleSave" :disabled="saving">
          <Save /> {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <div class="detail-grid">
      <div class="card detail-info">
        <h3><User /> Core Information</h3>
        <div class="form-group">
          <label>Full Name</label>
          <input v-model="lead.full_name" type="text">
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input v-model="lead.phone" type="text" disabled>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select v-model="lead.status">
            <option v-for="s in options?.statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <div class="card detail-events">
        <h3><Calendar /> Event Interest</h3>
        <div class="form-group">
          <label>Primary Event</label>
          <input v-model="lead.primary_event" type="text" disabled>
        </div>
        <div class="form-group">
          <label>Source</label>
          <input v-model="lead.source" type="text" disabled>
        </div>
      </div>

      <div class="card detail-remarks" style="grid-column: span 2;">
        <h3>Remarks</h3>
        <textarea v-model="lead.remarks" rows="6" style="width: 100%;"></textarea>
        
        <div class="quick-notes" style="margin-top: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-size: 0.8125rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Quick Notes</label>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary btn-sm" @click="addQuickNote('Follow Up Call Done')" style="padding: 0.4rem 0.8rem; font-size: 0.8125rem;">Follow Up Call Done</button>
            <button type="button" class="btn btn-secondary btn-sm" @click="addQuickNote('WhatsApp Details Sent!')" style="padding: 0.4rem 0.8rem; font-size: 0.8125rem;">WhatsApp Details Sent!</button>
            <button type="button" class="btn btn-secondary btn-sm" @click="addQuickNote('Need to Call Back')" style="padding: 0.4rem 0.8rem; font-size: 0.8125rem;">Need to Call Back</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="loading-state">
    <p>Loading lead details...</p>
  </div>
</template>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
</style>
