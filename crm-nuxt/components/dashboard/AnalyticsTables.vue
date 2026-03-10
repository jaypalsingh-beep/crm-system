
<script setup lang="ts">
const props = defineProps<{
  leads: any[]
}>()

const eventStats = computed(() => {
  const stats: Record<string, number> = {}
  props.leads.forEach(l => {
    stats[l.primary_event] = (stats[l.primary_event] || 0) + 1
  })
  return Object.entries(stats).map(([name, count]) => ({ name, count }))
})

const userStats = computed(() => {
  const stats: Record<string, number> = {}
  props.leads.forEach(l => {
    if (!['Booked', 'Not Interested'].includes(l.status)) {
      const userName = l.profiles?.full_name || 'Unassigned'
      stats[userName] = (stats[userName] || 0) + 1
    }
  })
  return Object.entries(stats).map(([name, count]) => ({ name, count }))
})
</script>

<template>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
    <div class="card">
      <h2>Leads by Event</h2>
      <div class="table-responsive">
        <table>
          <thead>
            <tr> <th>Event</th> <th>Count</th> </tr>
          </thead>
          <tbody>
            <tr v-for="s in eventStats" :key="s.name">
              <td>{{ s.name }}</td> <td><strong>{{ s.count }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <h2>Leads by User</h2>
      <div class="table-responsive">
        <table>
          <thead>
            <tr> <th>User</th> <th>Active Leads</th> </tr>
          </thead>
          <tbody>
            <tr v-for="s in userStats" :key="s.name">
              <td>{{ s.name }}</td> <td><span class="badge status-ready-to-book">{{ s.count }} Active</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
