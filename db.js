import { supabase } from './supabase.js';

// --- Form Options ---
export async function getFormOptions() {
    const { data, error } = await supabase
        .from('form_options')
        .select('*')
        .eq('is_active', true);
    
    if (error) return { events: [], sources: [], reasons: [], actions: [] };

    // Group by category for easier use
    const grouped = {
        events: data.filter(d => d.category === 'events').map(d => d.value),
        sources: data.filter(d => d.category === 'sources').map(d => d.value),
        reasons: data.filter(d => d.category === 'reasons').map(d => d.value),
        actions: data.filter(d => d.category === 'actions').map(d => d.value)
    };
    return grouped;
}

// --- Leads ---
export async function getLeads(filters = {}) {
    let query = supabase.from('leads').select('*, profiles(full_name)');

    if (filters.status && filters.status !== 'All') {
        query = query.eq('status', filters.status);
    }
    if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,primary_event.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
}

export async function getLeadById(id) {
    const { data, error } = await supabase
        .from('leads')
        .select('*, lead_activities(*), profiles(full_name)')
        .eq('id', id)
        .single();
    return { data, error };
}

export async function createLead(leadData) {
    const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select();
    return { data, error };
}

export async function updateLead(id, updates) {
    const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select();
    return { data, error };
}

// --- Activities ---
export async function addLeadActivity(activity) {
    const { data, error } = await supabase
        .from('lead_activities')
        .insert([activity]);
    return { data, error };
}

// --- Users & Assignments ---
export async function getUsers() {
    const { data, error } = await supabase.from('profiles').select('*');
    return { data, error };
}

export async function getEventAssignments() {
    const { data, error } = await supabase
        .from('event_assignments')
        .select('*, profiles(full_name)');
    
    const map = {};
    if (data) {
        data.forEach(item => {
            map[item.event_value] = item.profiles.full_name;
        });
    }
    return map;
}

export async function setEventAssignment(event, userId) {
    const { data, error } = await supabase
        .from('event_assignments')
        .upsert([{ event_value: event, user_id: userId }], { onConflict: 'event_value' });
    return { data, error };
}
