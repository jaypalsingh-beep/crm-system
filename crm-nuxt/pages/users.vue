
<script setup lang="ts">
import { Trash2, Edit2, UserPlus } from 'lucide-vue-next'

const { getUsers, deleteUser } = useUsers()
const { getFormOptions } = useSettings()

const users = ref<any[]>([])
const options = ref<any>(null)
const loading = ref(true)

const loadData = async () => {
  const [userRes, optRes] = await Promise.all([
    getUsers(),
    getFormOptions()
  ])
  if (userRes.success) users.value = userRes.data
  if (optRes.success) options.value = optRes.data
  loading.value = false
}

const handleDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this user?')) {
    const { success } = await deleteUser(id)
    if (success) {
      users.value = users.value.filter(u => u.id !== id)
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="users-view active">
    <!-- List of Users -->
    <section class="card table-card" style="margin-top: 1.5rem;">
      <div class="table-header">
        <h2>Team Members</h2>
        <button class="btn btn-primary"><UserPlus /> Add Member</button>
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Events</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td><strong>{{ user.full_name }}</strong></td>
              <td>{{ user.email }}</td>
              <td><span class="badge status-pending">{{ user.role }}</span></td>
              <td>
                <div class="event-tags">
                  <span v-for="ea in user.event_assignments" :key="ea.event_value" class="tag">
                    {{ ea.event_value }}
                  </span>
                </div>
              </td>
               <td>
                <div class="row-actions">
                  <button class="btn icon-btn" style="color: var(--primary);"><Edit2 /></button>
                  <button class="btn icon-btn" @click="handleDelete(user.id)" style="color: var(--error);"><Trash2 /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.tag {
  background: var(--bg-hover);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
}
.row-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
