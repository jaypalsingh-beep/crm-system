
export const useAuth = () => {
  const { $supabase } = useNuxtApp()
  const user = useState('user', () => null)
  const profile = useState('profile', () => null)
  const loading = useState('auth-loading', () => true)

  const checkUser = async () => {
    loading.value = true
    try {
      // Try to get session first for quick recovery
      const { data: { session }, error: sessionError } = await $supabase.auth.getSession()
      
      const authUser = session?.user
      if (sessionError || !authUser) {
        // Double check with getUser for security
        const { data: { user: verifiedUser } } = await $supabase.auth.getUser()
        if (!verifiedUser) {
          user.value = null
          profile.value = null
          loading.value = false
          return
        }
        user.value = verifiedUser
      } else {
        user.value = authUser
      }

      // Fetch profile
      const { data: p, error: profileError } = await $supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .maybeSingle()
      
      const fallbackProfile = { 
        role: 'Executive', 
        full_name: user.value.email?.split('@')[0] || 'User' 
      }
      
      profile.value = p || fallbackProfile
    } catch (err) {
      console.error('Auth check failed:', err)
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await $supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await checkUser()
    return data
  }

  const signOut = async () => {
    const { error } = await $supabase.auth.signOut()
    if (error) throw error
    user.value = null
    profile.value = null
    navigateTo('/login')
  }

  return { user, profile, loading, checkUser, signIn, signOut }
}
