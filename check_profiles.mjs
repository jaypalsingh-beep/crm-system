import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read config from JS file
const configPath = join(__dirname, 'js', 'config.js');
let configContent = readFileSync(configPath, 'utf-8');

// Extract URL and KEY using basic regex
const urlMatch = configContent.match(/SUPABASE_URL:\s*'([^']+)'/);
const keyMatch = configContent.match(/SUPABASE_KEY:\s*'([^']+)'/);

if (!urlMatch || !keyMatch) {
    console.error("Could not find Supabase credentials in config.");
    process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error fetching profiles:", error);
    } else {
        console.log("PROFILES IN DB:");
        console.log(JSON.stringify(data, null, 2));
    }
}

checkProfiles();
