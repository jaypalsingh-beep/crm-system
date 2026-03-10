
<script setup lang="ts">
import { Plus, Trash2, Settings } from 'lucide-vue-next'

const { getFormOptions } = useSettings()

const activeCategory = ref('events')
const options = ref<any>(null)
const loading = ref(true)
const newValue = ref('')

const categories = [
  { id: 'events', name: 'Events' },
  { id: 'sources', name: 'Sources' },
  { id: 'reasons', name: 'Reasons' },
  { id: 'actions', name: 'Actions' },
  { id: 'statuses', name: 'Statuses' }
]

const loadSettings = async () => {
  const { data, success } = await getFormOptions()
  if (success) options.value = data
  loading.value = false
}

const addOption = async () => {
  if (!newValue.value) return
  alert('Add option functionality needs implementation')
}

const removeOption = async (val: string) => {
  if (confirm(`Remove ${val}?`)) {
    options.value[activeCategory.value] = options.value[activeCategory.value].filter((v: string) => v !== val)
    alert('Real delete requires useSettings implementation')
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="settings-view active">
    <div class="settings-layout">
      <!-- Side Tabs -->
      <aside class="settings-sidebar">
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          class="settings-tab"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >
          {{ cat.name }}
        </button>
      </aside>

      <!-- Main Config Area -->
      <div class="settings-content">
        <div class="card">
          <div class="card-header">
            <h2>Manage {{ categories.find(c => c.id === activeCategory)?.name }}</h2>
          </div>
          <div class="add-option-box" style="display: flex; gap: 1rem; margin-bottom: 2rem;">
            <input v-model="newValue" type="text" :placeholder="`Add new ${activeCategory}...`" style="flex: 1;">
            <button class="btn btn-primary" @click="addOption"><Plus /> Add</button>
          </div>
          <div v-if="options" class="options-list">
             <div v-for="val in options[activeCategory]" :key="val" class="option-item">
               <span>{{ val }}</span>
               <button class="btn btn-secondary btn-sm" @click="removeOption(val)"><Trash2 /></button>
             </div>
          </div>
          <div v-else-if="loading">Loading settings...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-layout {
  display: flex;
  gap: 2rem;
}
.settings-sidebar {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.settings-tab {
  padding: 1rem;
  border: none;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.settings-tab.active {
  background: var(--primary);
  color: white;
}
.settings-content {
  flex: 1;
}
.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-main);
  border-bottom: 1px solid var(--border);
}
.option-item:last-child { border: none; }
</style>
