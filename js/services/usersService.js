import { supabase } from '../supabaseClient.js';

/**
 * Users Service
 * Handles user profiles and event assignments.
 */
export const usersService = {
    async getUsers() {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    event_assignments(event_value)
                `)
                .order('full_name');

            if (error) throw error;
            return { data, success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async ensureProfile(user) {
        if (!user) return { success: false };
        try {
            // Check if profile exists
            const { data: existing, error: fetchError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();
            
            if (fetchError) throw fetchError;
            
            if (!existing) {
                console.log("ensureProfile: Creating missing profile for", user.email);
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
                        role: user.user_metadata?.role || 'Executive',
                        password: user.user_metadata?.password || ''
                    });
                if (insertError) throw insertError;
            }
            return { success: true };
        } catch (error) {
            console.error("ensureProfile failed:", error);
            return { error: error.message, success: false };
        }
    },

    async getEventAssignments() {
        try {
            const { data, error } = await supabase
                .from('event_assignments')
                .select('*, profiles(id, full_name)');

            if (error) throw error;

            const map = {};
            data.forEach(item => {
                map[item.event_value] = { 
                    id: item.profiles.id, 
                    name: item.profiles.full_name 
                };
            });

            return { data: map, success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async updateProfile(id, updates) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { data: data[0], success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async saveEventAssignments(userId, events) {
        try {
            // 1. Delete existing for this user (only the ones he currently has)
            // Note: UNIQUE(event_value) prevents multiple people from having the same event.
            // If we want to assign an event TO someone, we must first make sure it's not assigned to someone else.
            
            // Delete current user's assignments first
            await supabase.from('event_assignments').delete().eq('user_id', userId);

            if (events.length === 0) return { success: true };

            const inserts = events.map(ev => ({
                user_id: userId,
                event_value: ev
            }));

            const { error } = await supabase.from('event_assignments').insert(inserts);
            if (error) throw error;

            return { success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async deleteUser(id) {
        // Technically we can't delete from auth.users easily, but we can delete the profile
        // and RLS/Foreign keys will handle the rest if configured.
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    }
}
