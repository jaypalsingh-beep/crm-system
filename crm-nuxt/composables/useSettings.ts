
export const useSettings = () => {
  const { $supabase } = useNuxtApp()

  const getFormOptions = async () => {
    try {
      const { data, error } = await $supabase
        .from('form_options')
        .select('*')
        .eq('is_active', true)

      if (error) throw error

      const grouped = {
        events: data.filter(d => d.category === 'events').map(d => d.value).sort((a,b) => a.localeCompare(b)),
        sources: data.filter(d => d.category === 'sources').map(d => d.value).sort((a,b) => a.localeCompare(b)),
        reasons: data.filter(d => d.category === 'reasons').map(d => d.value).sort((a,b) => a.localeCompare(b)),
        actions: data.filter(d => d.category === 'actions').map(d => d.value).sort((a,b) => a.localeCompare(b)),
        statuses: data.filter(d => d.category === 'statuses').map(d => d.value).sort((a,b) => a.localeCompare(b))
      }

      return { data: grouped, success: true }
    } catch (error) {
      return { error: error.message, success: false }
    }
  }

  return { getFormOptions }
}
