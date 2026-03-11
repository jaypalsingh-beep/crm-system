import { supabase } from '../supabaseClient.js';

/**
 * Settings Service
 * Handles dynamic form options (Events, Sources, Reasons, Actions).
 */
export const settingsService = {
    async getFormOptions() {
        try {
            const { data, error } = await supabase
                .from('form_options')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;

            const grouped = {
                events: data.filter(d => d.category === 'events').map(d => d.value).sort((a, b) => a.localeCompare(b)),
                sources: data.filter(d => d.category === 'sources').map(d => d.value).sort((a, b) => a.localeCompare(b)),
                reasons: data.filter(d => d.category === 'reasons').map(d => d.value).sort((a, b) => a.localeCompare(b)),
                actions: data.filter(d => d.category === 'actions').map(d => d.value).sort((a, b) => a.localeCompare(b)),
                statuses: data.filter(d => d.category === 'statuses').map(d => d.value).sort((a, b) => a.localeCompare(b))
            };

            return { data: grouped, success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async addFormOption(category, value) {
        try {
            const { data, error } = await supabase
                .from('form_options')
                .insert([{ category, value }])
                .select();

            if (error) throw error;
            return { data: data[0], success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async deleteFormOption(category, value) {
        try {
            const { error } = await supabase
                .from('form_options')
                .delete()
                .eq('category', category)
                .eq('value', value);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    }
};
