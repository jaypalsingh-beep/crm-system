
export const useLeads = () => {
  const { $supabase } = useNuxtApp()

  const getLeads = async (filters = {}) => {
    try {
      let query = $supabase
        .from('leads')
        .select('*, profiles!leads_assigned_to_fkey(full_name)')

      if (filters.status && filters.status !== 'All') {
        query = query.eq('status', filters.status)
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }
      if (filters.primary_event && filters.primary_event !== 'All') {
        query = query.eq('primary_event', filters.primary_event)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return { data, success: true }
    } catch (err) {
      return { error: err.message, success: false }
    }
  }

  const getLeadById = async (id) => {
    try {
      const { data, error } = await $supabase
        .from('leads')
        .select('*, profiles!leads_assigned_to_fkey(full_name)')
        .eq('id', id)
        .single()
      if (error) throw error
      return { data, success: true }
    } catch (err) {
      return { error: err.message, success: false }
    }
  }

  const createLead = async (leadData) => {
    try {
      const { data, error } = await $supabase
        .from('leads')
        .insert([leadData])
        .select()
      if (error) throw error
      return { data: data[0], success: true }
    } catch (err) {
      return { error: err.message, success: false }
    }
  }

  const updateLead = async (id, updates) => {
    try {
      const { data, error } = await $supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
      if (error) throw error
      return { data: data[0], success: true }
    } catch (err) {
      return { error: err.message, success: false }
    }
  }

  const getLeadRequests = async () => {
    try {
      const { data, error } = await $supabase
        .from('lead_requests')
        .select('*')
        .eq('status', 'pending')
      if (error) throw error
      return { data, success: true }
    } catch (err: any) {
      return { error: err.message, success: false }
    }
  }

  const approveLeadRequest = async (requestId: string, leadUpdates: any) => {
    try {
      // Logic for approve: update lead and mark request as approved
      const { data: lead, error: leadErr } = await $supabase
        .from('leads')
        .update(leadUpdates)
        .eq('phone', leadUpdates.phone)
        .select()
        .single()
      if (leadErr) throw leadErr
      
      const { data: req, error: reqErr } = await $supabase
        .from('lead_requests')
        .update({ status: 'approved' })
        .eq('id', requestId)
        .select()
        .single()
      if (reqErr) throw reqErr
      return { data: { lead, request: req }, success: true }
    } catch (err: any) {
      return { error: err.message, success: false }
    }
  }

  const rejectLeadRequest = async (requestId: string) => {
    try {
      const { data, error } = await $supabase
        .from('lead_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
      if (error) throw error
      return { success: true }
    } catch (err: any) {
      return { error: err.message, success: false }
    }
  }

  return { getLeads, getLeadById, createLead, updateLead, getLeadRequests, approveLeadRequest, rejectLeadRequest }
}

