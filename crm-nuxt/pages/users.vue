
<script setup lang="ts">
import { Trash2, Edit2, UserPlus, X } from 'lucide-vue-next'

const { getUsers, deleteUser, createUser, updateUser } = useUsers()
const { getFormOptions } = useSettings()

const users = ref<any[]>([])
const options = ref<any>(null)
const loading = ref(true)

const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)

const form = ref({
  id: '',
  full_name: '',
  email: '',
  password: '',
  role: 'Executive',
  events: [] as string[]
})

const loadData = async () => {
  const [userRes, optRes] = await Promise.all([
    getUsers(),
    getFormOptions()
  ])
  if (userRes.success) users.value = userRes.data
  if (optRes.success) options.value = optRes.data
  loading.value = false
}

const openAddModal = () => {
  isEditing.value = false
  form.value = { id: '', full_name: '', email: '', password: '', role: 'Executive', events: [] }
  showModal.value = true
}

const openEditModal = (user: any) => {
  isEditing.value = true
  form.value = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    password: '',
    role: user.role,
    events: user.event_assignments?.map((e: any) => e.event_value) || []
  }
  showModal.value = true
}

const saveMember = async () => {
  saving.value = true
  try {
    if (isEditing.value) {
      const updates = {
        full_name: form.value.full_name,
        role: form.value.role
      }
      const { success, error } = await updateUser(form.value.id, updates, form.value.events)
      if (success) {
        alert('User updated successfully')
        showModal.value = false
        loadData()
      } else {
        alert(error)
      }
    } else {
      const { success, error } = await createUser({
        email: form.value.email,
        password: form.value.password,
        full_name: form.value.full_name,
        role: form.value.role
      }, form.value.events)
      
      if (success) {
        alert('User added successfully')
        showModal.value = false
        loadData()
      } else {
        alert(error)
      }
    }
  } finally {
    saving.value = false
  }
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
        <button class="btn btn-primary" @click="openAddModal"><UserPlus /> Add Member</button>
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
                  <button class="btn icon-btn" @click="openEditModal(user)" style="color: var(--primary);"><Edit2 /></button>
                  <button class="btn icon-btn" @click="handleDelete(user.id)" style="color: var(--error);"><Trash2 /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modal overlay -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Team Member' : 'Add Team Member' }}</h3>
          <button class="btn icon-btn" @click="showModal = false"><X /></button>
        </div>
        <form @submit.prevent="saveMember" class="modal-body">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="form.full_name" type="text" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" :disabled="isEditing" required>
          </div>
          <div v-if="!isEditing" class="form-group">
            <label>Password</label>
            <input v-model="form.password" type="password" required>
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="form.role" required>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Executive">Executive</option>
              <option value="Refund Manager">Refund Manager</option>
              <option value="Special Camp Manager">Special Camp Manager</option>
            </select>
          </div>
          <div class="form-group" style="z-index: 2;">
            <label>Assigned Events</label>
            <SharedMultiSelect v-model="form.events" :options="options?.events || []" label="Select Events" />
          </div>

          <div class="modal-actions" style="margin-top: 1.5rem; display: flex; gap: 1rem;">
            <button type="button" class="btn btn-secondary" @click="showModal = false" style="flex: 1;">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving" style="flex: 1;">
              {{ saving ? 'Saving...' : 'Save Member' }}
            </button>
          </div>
        </form>
      </div>
    </div>
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
  border: 1px solid var(--border);
}
.row-actions {
  display: flex;
  gap: 0.5rem;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.modal {
  background: white;
  border-radius: var(--radius-l);
  width: 90%;
  max-width: 500px;
  max-height: 90vh; /* Adjust height to prevent going off screen */
  overflow-y: auto; /* Enable scroll if content is too large */
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}
.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
}
</style>
