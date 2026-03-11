import { supabase } from '../supabaseClient.js';

/**
 * Leads Service
 * Handles all database operations related to leads.
 */
export const leadsService = {
    /**
     * Create a lead request when a duplicate phone is entered.
     * @param {Object} requestData - { phone, events_interested, primary_event, requester_id }
     */
    async createLeadRequest(requestData) {
        try {
            const { data, error } = await supabase
                .from('lead_requests')
                .insert([requestData])
                .select();
            if (error) throw error;
            return { data: data[0], success: true };
        } catch (err) {
            return { error: err.message, success: false };
        }
    },

    /** Fetch all pending lead requests */
    async getLeadRequests() {
        try {
            const { data, error } = await supabase
                .from('lead_requests')
                .select('*, requester:profiles(full_name)')
                .eq('status', 'pending');
            if (error) throw error;
            return { data, success: true };
        } catch (err) {
            return { error: err.message, success: false };
        }
    },

    /** Approve a lead request: update the lead and mark request as approved */
    async approveLeadRequest(requestId, leadUpdates) {
        try {
            // Update lead
            const { data: lead, error: leadErr } = await supabase
                .from('leads')
                .update(leadUpdates)
                .eq('phone', leadUpdates.phone)
                .select()
                .single();
            if (leadErr) throw leadErr;
            // Update request status
            const { data: req, error: reqErr } = await supabase
                .from('lead_requests')
                .update({ status: 'approved' })
                .eq('id', requestId)
                .select()
                .single();
            if (reqErr) throw reqErr;
            return { data: { lead, request: req }, success: true };
        } catch (err) {
            return { error: err.message, success: false };
        }
    },

    /** Reject a lead request */
    async rejectLeadRequest(requestId) {
        try {
            const { data, error } = await supabase
                .from('lead_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId)
                .select()
                .single();
            if (error) throw error;
            return { data, success: true };
        } catch (err) {
            return { error: err.message, success: false };
        }
    },
    /**
     * Fetch leads with advanced filtering
     * @param {Object} filters - status, assigned_to, primary_event, date_from, date_to, search
     */
    async getLeads(filters = {}) {
        try {
            let query = supabase
                .from('leads')
                .select('*, profiles:assigned_to (full_name)');

            if (filters.status && filters.status !== 'All') {
                query = query.eq('status', filters.status);
            }
            if (filters.assigned_to) {
                query = query.eq('assigned_to', filters.assigned_to);
            }
            if (filters.primary_event && filters.primary_event !== 'All') {
                query = query.eq('primary_event', filters.primary_event);
            }
            if (filters.date_from) {
                query = query.gte('created_at', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('created_at', filters.date_to);
            }
            if (filters.search) {
                query = query.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return { data, success: true };
        } catch (error) {
            console.error('Error fetching leads:', error.message);
            return { error: error.message, success: false };
        }
    },

    async getLeadById(id) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*, profiles:assigned_to (full_name)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async createLead(leadData) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .insert([leadData])
                .select();

            if (error) throw error;
            return { data: data[0], success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async updateLead(id, updates) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { data: data[0], success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async deleteLead(id) {
        try {
            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async getLeadByPhone(phone) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('phone', phone)
                .maybeSingle();

            if (error) throw error;
            return { data, success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    /** Check if a lead exists by phone number using an RPC (bypasses RLS filters) */
    async checkLeadExists(phone) {
        try {
            const { data, error } = await supabase.rpc('check_lead_exists_by_phone', { phone_number: phone });
            if (error) throw error;
            return { data, success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async assignLead(id, userId) {
        return this.updateLead(id, { assigned_to: userId });
    }
};
