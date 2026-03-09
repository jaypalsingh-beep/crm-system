import { supabase } from '../supabaseClient.js';

/**
 * Leads Service
 * Handles all database operations related to leads.
 */
export const leadsService = {
    /**
     * Fetch leads with advanced filtering
     * @param {Object} filters - status, assigned_to, primary_event, date_from, date_to, search
     */
    async getLeads(filters = {}) {
        try {
            let query = supabase
                .from('leads')
                .select('*, profiles!leads_assigned_to_fkey(full_name)');

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
                .select('*, profiles!leads_assigned_to_fkey(full_name)')
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

    async assignLead(id, userId) {
        return this.updateLead(id, { assigned_to: userId });
    }
};
