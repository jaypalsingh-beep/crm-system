import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const url = 'https://ebfxdhwagcboyuscgigh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZnhkaHdhZ2Nib3l1c2NnaWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDIwMjIsImV4cCI6MjA4ODQ3ODAyMn0.8HXM0aAC27zZa9ghMDfvfzrxi0cyZnKkMGy9IWEXNzc';

const supabase = createClient(url, key);

async function test() {
    // 1. Sign in as admin
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'rushiraj@invinciblengo.org',
        password: 'password' // Assuming this is test password, or we can just trace REST
    });
    
    if (authErr) {
        console.error('Auth error:', authErr.message);
        return;
    }
    
    console.log('Logged in as:', authData.user.email);
    
    // 2. Query form_options
    const { data: optData, error: optErr } = await supabase.from('form_options').select('*');
    console.log('Form options:', optData ? optData.length : optErr);
    
    // 3. Query profiles
    const { data: profData, error: profErr } = await supabase.from('profiles').select('*');
    console.log('Profiles:', profData ? profData.length : profErr);
}
test();
