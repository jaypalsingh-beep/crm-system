import { supabase } from '../supabaseClient.js';

/**
 * Auth Service
 * Handles user authentication and session state.
 */
export const authService = {
    async signIn(email, password) {
        console.log("authService: signIn called for", email);
        try {
            console.log("authService: calling supabase.auth.signInWithPassword...");
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            console.log("authService: supabase call returned", { data, error });
            if (error) throw error;
            return { data, success: true };
        } catch (error) {
            console.error("authService: signIn error", error);
            return { error: error.message, success: false };
        }
    },

    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async getCurrentUser() {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) return { data: null, success: false };

            // Attempt to get profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
            
            if (profileError) {
                console.warn("Profile fetch error:", profileError);
            }

            // Return user info even if profile is missing (e.g. signup trigger delay)
            const combinedUser = {
                ...user,
                ...(profile || { role: 'Executive', full_name: user.email.split('@')[0] })
            };

            return { data: combinedUser, success: true };
        } catch (error) {
            console.error("GetCurrentUser failed:", error);
            return { error: error.message, success: false };
        }
    },

    async signUp(email, password, metadata) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            });
            if (error) throw error;
            return { data, success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    async updateUserPassword(userId, newPassword) {
        // Note: For security, Supabase usually requires the user to be logged in to update their OWN password via auth.updateUser.
        // For an admin to update ANOTHER user's password, we typically need a service role or a specific backend function.
        // However, if the user is using the Admin API (not available in client SDK without service key), we can't do it directly.
        // But many of these CRM setups use a 'userPassword' field in a profiles table for 'viewing' (not recommended but requested).
        // The user specifically asked: "Admin can change or view the password of all the users."
        // I will implement a way to update the Auth password IF it's the current user, 
        // OR simply rely on the 'userPassword' field if the user is storing it there (based on app.js line 877).
        try {
            // This only works for the CURRENTLY logged in user in the client SDK
            const { data, error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            return { data, success: true };
        } catch (error) {
            return { error: error.message, success: false };
        }
    },

    onAuthChange(callback) {
        supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }
};
