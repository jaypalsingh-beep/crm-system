
<script setup lang="ts">
import { BarChart3, TrendingUp, PieChart } from 'lucide-vue-next'
</script>

<template>
  <div class="reports-view active">
    <div class="summary-grid">
      <div class="stat-card">
         <div class="stat-icon"><TrendingUp /></div>
         <div class="stat-info">
           <h3>Growth</h3>
           <p>Coming Soon</p>
         </div>
      </div>
       <div class="stat-card">
         <div class="stat-icon"><PieChart /></div>
         <div class="stat-info">
           <h3>Event Split</h3>
           <p>Coming Soon</p>
         </div>
      </div>
    </div>
    <div class="card" style="margin-top: 2rem; padding: 4rem; text-align: center;">
       <BarChart3 style="width: 64px; height: 64px; color: var(--primary-light); opacity: 0.3; margin-bottom: 1.5rem;" />
       <h2>Advanced Analytics Pipeline</h2>
       <p style="color: var(--text-muted);">We are working on powerful insights and visualizations for your leads and team performance.</p>
    </div>
  </div>
</template>
