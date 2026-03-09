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
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Resolve user names from profiles
            const userIds = [...new Set(data.map(a => a.user_id).filter(Boolean))];
            let profileMap = {};
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds);
                if (profiles) {
                    profiles.forEach(p => profileMap[p.id] = p.full_name);
                }
            }

            // Attach profile info to each activity
            const enriched = data.map(a => ({
                ...a,
                profiles: { full_name: profileMap[a.user_id] || null }
            }));

            return { data: enriched, success: true };
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
