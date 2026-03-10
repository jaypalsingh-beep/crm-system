
<script setup lang="ts">
import { 
  Users, 
  Layers, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  PieChart,
  HelpCircle
} from 'lucide-vue-next'

const props = defineProps<{
  title: string
  value: string | number
  icon: string
}>()

const iconComponent = computed(() => {
  const iconMap: Record<string, any> = {
    'Users': Users,
    'Layers': Layers,
    'CheckCircle': CheckCircle,
    'AlertCircle': AlertCircle,
    'TrendingUp': TrendingUp,
    'PieChart': PieChart
  }
  return iconMap[props.icon] || HelpCircle
})
</script>

<template>
  <div class="stat-card">
    <div class="stat-icon" style="background: var(--bg-main); color: var(--primary); display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px;">
      <component :is="iconComponent" style="width: 24px; height: 24px;" />
    </div>
    <div class="stat-info">
      <h3 style="color: var(--text-light); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">{{ title }}</h3>
      <p class="stat-value" style="font-size: 1.75rem; font-weight: 700; color: var(--text-dark);">{{ value }}</p>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: transform 0.3s ease;
}
.stat-card:hover {
  transform: translateY(-5px);
}
</style>
