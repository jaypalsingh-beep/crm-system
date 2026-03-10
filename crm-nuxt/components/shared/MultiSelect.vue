
<script setup lang="ts">
const props = defineProps<{
  options: string[]
  modelValue: string[]
  label?: string
}>()

const emit = defineEmits(['update:modelValue'])

const toggleOption = (opt: string) => {
  const newList = [...props.modelValue]
  const index = newList.indexOf(opt)
  if (index > -1) {
    newList.splice(index, 1)
  } else {
    newList.push(opt)
  }
  emit('update:modelValue', newList)
}
</script>

<template>
  <div class="multi-select-container">
    <label v-if="label">{{ label }}</label>
    <div class="multi-select-grid">
      <label v-for="opt in options" :key="opt" class="checkbox-option">
        <input 
          type="checkbox" 
          :checked="modelValue.includes(opt)" 
          @change="toggleOption(opt)"
        >
        <span>{{ opt }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.multi-select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  border: 1px solid var(--border);
}
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
</style>
