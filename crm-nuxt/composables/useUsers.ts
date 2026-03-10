
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
    // This usually involves auth.signUp + profile update
    // For simplicity, we'll assume a direct profile insert or handled by trigger
    return { success: false, error: 'User creation via Auth API needed' }
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

  return { getUsers, createUser, deleteUser }
}
