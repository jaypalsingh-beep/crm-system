import { supabase } from '../supabaseClient.js';

/**
 * Activities Service
 * Handles logging and fetching lead-related activities and notes.
 */
export const activitiesService = {
    async getActivities(leadId) {
        try {
            const { data, error } = await supabase
                .from('lead_activities')
                .select('*, profiles(full_name)')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async addActivity(leadId, type, content) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('lead_activities')
                .insert([{
                    lead_id: leadId,
                    user_id: user.id,
                    activity_type: type,
                    content: content
                }])
                .select();

            if (error) throw error;
            return { data: data[0], success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async logStatusChange(leadId, oldStatus, newStatus) {
        return this.addActivity(
            leadId, 
            'status_change', 
            `Status changed from "${oldStatus}" to "${newStatus}"`
        );
    }
};
