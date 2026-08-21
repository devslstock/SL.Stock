import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
    }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Fetching latest logs...");
    const { data, error } = await supabase
        .from('focus_nfe_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error("Error fetching logs:", error);
    } else {
        data.forEach(log => {
            console.log("\n--------------------------------");
            console.log("Created At:", log.created_at);
            console.log("Status:", log.status);
            console.log("Request keys:", Object.keys(log.request_payload || {}));
            
            if (log.request_payload?.arquivo_logo_base64) {
                console.log("Logo length sent:", log.request_payload.arquivo_logo_base64.length);
            } else {
                console.log("NO LOGO SENT");
                if (log.request_payload?.delete_logo) {
                    console.log("DELETE LOGO WAS SENT");
                }
            }
            
            console.log("Response:", JSON.stringify(log.response_payload).substring(0, 500));
        });
    }
}

main();
