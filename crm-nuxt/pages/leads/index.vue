
<script setup lang="ts">
import { Download, UploadCloud } from 'lucide-vue-next'

const { getLeads } = useLeads()
const { profile } = useAuth()

const leads = ref<any[]>([])
const loading = ref(true)

const filters = ref({
  search: '',
  status: 'All',
  date_from: '',
  date_to: ''
})

const fetchLeads = async () => {
  loading.value = true
  const { data, success } = await getLeads(filters.value)
  if (success) {
    leads.value = data || []
  }
  loading.value = false
}

const resetFilters = () => {
  filters.value = {
    search: '',
    status: 'All',
    date_from: '',
    date_to: ''
  }
  fetchLeads()
}

const getStatusClass = (status: string) => {
  const s = status.toLowerCase().replace(/\s+/g, '-')
  return `status-${s}`
}

watch(filters, () => {
  fetchLeads()
}, { deep: true })

onMounted(() => {
  fetchLeads()
})

const downloadSample = () => {
  const headers = "name,phone,source,primary_event,travel_date,remarks";
  const sampleRow = "John Doe,1234567890,Google Search,Bali Retreat 2024,2024-12-31,Highly interested"
  const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sampleRow
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "crm_bulk_import_sample.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const triggerBulkImport = () => {
  const input = document.getElementById('bulkImportInput')
  if (input) input.click()
}

const handleBulkImport = (e: any) => {
  const file = e.target.files[0]
  if (!file) return
  // Logic for bulk import would go here (similar to app.js)
  alert('Bulk import functionality needs implementation in useLeads')
}
</script>

<template>
  <div class="leads-view active">
    <section class="card table-card">
      <div class="table-header">
        <h2>Inquiries List</h2>
        <div class="table-controls">
          <div class="filter-bar">
            <div class="filter-group">
              <label>Search:</label>
              <div class="search-box">
                <input v-model="filters.search" type="text" placeholder="Search name, phone, event...">
              </div>
            </div>
            <div class="filter-group">
              <label>Status:</label>
              <select v-model="filters.status">
                <option value="All">All Status</option>
                <option value="New Inquiry">New Inquiry</option>
                <option value="Interested">Interested</option>
                <option value="Considering">Considering</option>
                <option value="Follow-up Needed">Follow-up Needed</option>
                <option value="Ready to Book">Ready to Book</option>
                <option value="Booked">Booked</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>
            <div class="filter-group">
              <label>From:</label>
              <input v-model="filters.date_from" type="date">
            </div>
            <div class="filter-group">
              <label>To:</label>
              <input v-model="filters.date_to" type="date">
            </div>
            <button @click="resetFilters" class="btn btn-secondary" style="margin-left: auto;">Reset</button>
            <button v-if="profile?.role === 'Admin'" @click="downloadSample" class="btn btn-secondary" style="margin-left: 1rem; border: 1px dotted var(--primary-light); background: transparent; color: var(--primary);">
              <Download style="width: 14px; height: 14px; margin-right: 0.4rem;" />
              Sample CSV
            </button>
            <button v-if="profile?.role === 'Admin'" @click="triggerBulkImport" class="btn btn-primary" style="margin-left: 0.5rem; background: var(--secondary); border: 1px solid var(--primary-light);">
              <UploadCloud style="width: 16px; height: 16px; margin-right: 0.5rem;" />
              Bulk Import
            </button>
            <input type="file" id="bulkImportInput" style="display: none;" accept=".csv" @change="handleBulkImport">
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Source</th>
              <th>Primary Event</th>
              <th>Travel Date</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Actions Required</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in leads" :key="lead.id" @click="navigateTo(`/leads/${lead.id}`)">
              <td><strong>{{ lead.full_name }}</strong></td>
              <td>{{ lead.phone }}</td>
              <td>{{ lead.source }}</td>
              <td>{{ lead.primary_event }}</td>
              <td>{{ lead.travel_date }}</td>
              <td><span class="badge" :class="getStatusClass(lead.status)">{{ lead.status }}</span></td>
              <td>{{ lead.profiles?.full_name || 'Unassigned' }}</td>
              <td>{{ (lead.actions_required || []).join(', ') || '-' }}</td>
            </tr>
            <tr v-if="leads.length === 0 && !loading">
              <td colspan="8" style="text-align:center; padding: 3rem;">No leads found matching criteria</td>
            </tr>
            <tr v-if="loading">
              <td colspan="8" style="text-align:center; padding: 3rem;">Loading leads...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
