
<script setup lang="ts">
import { Mail, Lock, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const { signIn, profile } = useAuth()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

const handleLogin = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    await signIn(email.value, password.value)
    navigateTo('/')
  } catch (err: any) {
    errorMsg.value = err.message || 'Login failed'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (profile.value) {
    navigateTo('/')
  }
})
</script>

<template>
  <div class="login-view active">
    <div class="card login-card">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">Welcome Back</h2>
        <p style="color: var(--text-muted);">Please enter your details to sign in.</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="loginEmail">Email Address</label>
          <div style="position: relative;">
            <Mail style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-light);" />
            <input v-model="email" type="email" id="loginEmail" required placeholder="name@company.com" style="padding-left: 3rem; width: 100%;">
          </div>
        </div>
        <div class="form-group" style="margin-top: 1.5rem;">
          <label for="loginPassword">Password</label>
          <div style="position: relative;">
            <Lock style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-light);" />
            <input v-model="password" type="password" id="loginPassword" required placeholder="••••••••" style="padding-left: 3rem; width: 100%;">
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top: 2rem; width: 100%;" :disabled="loading">
          <span v-if="!loading">Sign In</span>
          <span v-else>Signing in...</span>
          <ArrowRight v-if="!loading" style="width: 18px; height: 18px; margin-left: 0.5rem;" />
        </button>
      </form>
      <p v-if="errorMsg" style="margin-top: 1.5rem; color: var(--error); font-size: 0.875rem; padding: 0.75rem; background: var(--error-bg); border-radius: 8px;">
        {{ errorMsg }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-main);
}
.login-card {
  width: 100%;
  max-width: 440px;
  padding: 3rem;
}
</style>
