
<script setup lang="ts">
import { User, Phone, MapPin, MessageSquare, Clipboard } from 'lucide-vue-next'

const { getFormOptions } = useSettings()
const { createLead } = useLeads()
const { profile } = useAuth()

const options = ref<{
  events: string[]
  sources: string[]
  reasons: string[]
  actions: string[]
  statuses: string[]
}>({
  events: [],
  sources: [],
  reasons: [],
  actions: [],
  statuses: []
})

const formData = ref({
  full_name: '',
  phone: '',
  source: '',
  events_interested: [] as string[],
  primary_event: '',
  reason_to_call: '',
  action_required: '',
  status: '',
  remarks: '',
  assigned_to: '',
  travel_date: ''
})

const loading = ref(true)
const saving = ref(false)

const loadOptions = async () => {
  const { data, success } = await getFormOptions()
  if (success && data) {
    options.value = data
  }
  loading.value = false
}

const handlePhoneBlur = async () => {
  if (formData.value.phone.length >= 10) {
    // Check if lead already exists
    // alert('Duplicate check logic would go here')
  }
}

const handleSubmit = async () => {
  saving.value = true
  try {
    const { data, success, error } = await createLead(formData.value)
    if (success) {
      alert('Lead created successfully!')
      navigateTo('/leads')
    } else {
      alert('Error: ' + error)
    }
  } finally {
    saving.value = false
  }
}

const clearForm = () => {
  if (confirm('Clear all fields?')) {
    formData.value = {
      full_name: '',
      phone: '',
      source: '',
      events_interested: [],
      primary_event: '',
      reason_to_call: '',
      action_required: '',
      status: '',
      remarks: '',
      assigned_to: '',
      travel_date: ''
    }
  }
}

const addQuickNote = (note: string) => {
  formData.value.remarks = formData.value.remarks 
    ? formData.value.remarks + '\n- ' + note 
    : '- ' + note
}

onMounted(() => {
  loadOptions()
})
</script>

<template>
  <div class="form-container">
    <div v-if="loading" class="loading-state">Loading form options...</div>
    <form v-else @submit.prevent="handleSubmit">
      <div class="form-grid">
        <!-- Contact Info -->
        <div class="form-section">
          <h3><User /> Contact Information</h3>
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="formData.full_name" type="text" required placeholder="Enter full name">
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input v-model="formData.phone" type="tel" required @blur="handlePhoneBlur" placeholder="Enter phone number">
          </div>
          <div class="form-group">
            <label>Source</label>
            <select v-model="formData.source" required>
              <option value="" disabled>Select Source</option>
              <option v-for="s in options.sources" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <!-- Interest info -->
        <div class="form-section">
          <h3><MapPin /> Interested Events</h3>
          <SharedMultiSelect 
            v-model="formData.events_interested" 
            :options="options.events" 
            label="Events Interested"
          />
          <div v-if="formData.events_interested.length > 0" class="form-group" style="margin-top: 1rem;">
            <label>Primary Event</label>
            <select v-model="formData.primary_event" required>
              <option v-for="e in formData.events_interested" :key="e" :value="e">{{ e }}</option>
            </select>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label>Tentative Travel Date</label>
            <input v-model="formData.travel_date" type="date" required>
          </div>
        </div>

        <!-- Engagement -->
        <div class="form-section">
          <h3><MessageSquare /> Engagement</h3>
          <div class="form-group">
            <label>Reason to Call</label>
            <select v-model="formData.reason_to_call" required>
              <option v-for="r in options.reasons" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Action Required</label>
            <select v-model="formData.action_required" required>
              <option v-for="a in options.actions" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>
          <div class="form-group">
             <label>Current Status</label>
            <select v-model="formData.status" required>
              <option v-for="s in options.statuses" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <!-- Admin -->
        <div class="form-section">
          <h3><Clipboard /> Remarks</h3>
          <div class="form-group">
            <label>Remarks</label>
            <textarea v-model="formData.remarks" rows="5" placeholder="Additional notes..."></textarea>
          </div>
          
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

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Inquiry' }}
        </button>
        <button type="button" @click="clearForm" class="btn btn-secondary">Clear Form</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
.form-actions {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
}
.form-actions button {
  flex: 1;
}
</style>
