
export const useUsers = () => {
  const { $supabase } = useNuxtApp()

  const getUsers = async () => {
    try {
      const { data, error } = await $supabase
        .from('profiles')
        .select('*, event_assignments(event_value)')
      if (error) throw error
      return { data, success: true }
    } catch (err: any) {
      return { error: err.message, success: false }
    }
  }

  const createUser = async (userData: any, events: string[]) => {
    // Usually handled by a server route with service role key, but here we'll try auth.signUp. 
    // WARNING: This logs out the current user by default in Supabase. A server endpoint is the correct long-term fix.
    try {
      const { data, error } = await $supabase.auth.signUp({
        email: userData.email,
        password: userData.password || 'TemporaryPassword123!',
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role
          }
        }
      })
      if (error) throw error
      const userId = data.user?.id
      if (userId && events && events.length > 0) {
        await assignEvents(userId, events)
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const updateUser = async (userId: string, updates: any, events: string[]) => {
    try {
      if (updates && Object.keys(updates).length > 0) {
        const { error } = await $supabase.from('profiles').update(updates).eq('id', userId)
        if (error) throw error
      }
      if (events) {
        await assignEvents(userId, events)
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const assignEvents = async (userId: string, events: string[]) => {
    try {
      // Clear old
      await $supabase.from('event_assignments').delete().eq('user_id', userId)
      // Insert new
      if (events.length > 0) {
        const inserts = events.map(e => ({ user_id: userId, event_value: e }))
        await $supabase.from('event_assignments').insert(inserts)
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const { error } = await $supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      if (error) throw error
      return { success: true }
    } catch (err: any) {
      return { error: err.message, success: false }
    }
  }

  return { getUsers, createUser, updateUser, deleteUser, assignEvents }
}
