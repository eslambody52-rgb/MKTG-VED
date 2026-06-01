import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnvFile = (filename) => {
  try {
    const content = fs.readFileSync(path.join(__dirname, filename), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value.replace(/\\n/g, '\n');
    }
  } catch {
    // ignore
  }
};

loadEnvFile('.env.local');
loadEnvFile('.env');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials in .env or .env.local");
  process.exit(1);
}

const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PUBLISHED_ID = '2PACX-1vRuuQ4J0z5ze6hHeZIvM24VqPApNS_eHIvnBmZ4EyPWj7J1MpvBOyPodwx0DKa1yqNkjlFdahgN6jZI';

const parseCsv = (text) => {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else if (char === '\r' && !inQuotes) {
    } else {
      currentCell += char;
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }
  return rows;
};

const fixedStages = [
  { label: 'التجميعات', gid: '1535230545' },
  { label: 'Junior 4', gid: '497207661' },
  { label: 'Junior 5', gid: '96752860' },
  { label: 'Junior 6', gid: '346788121' },
  { label: 'Middle 1', gid: '458352282' },
  { label: 'Middle 2', gid: '2113852114' },
  { label: 'Middle 3', gid: '2089699920' },
  { label: 'Senior 1', gid: '1640460225' },
  { label: 'Senior 2', gid: '595027661' },
  { label: 'Senior 3', gid: '286303232' }
];

async function migrate() {
  console.log("Starting Migration...");

  for (const stage of fixedStages) {
    console.log(`\nFetching ${stage.label} (GID: ${stage.gid})...`);
    
    // First, let's fetch it via the dev-proxy (so we get the identical filtered results if any logic is applied, but actually the raw CSV is better so we don't have dependency issues)
    // Actually, dev-proxy runs on port 3001
    try {
      const res = await fetch(`http://localhost:3001/api/sheet?gid=${stage.gid}`);
      if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
      const data = await res.json();
      
      const rows = data.rows || [];
      const sheetName = data.sheetName || `Static Sheet ${stage.gid}`;
      
      console.log(`Fetched ${rows.length} rows for ${stage.label}.`);
      
      const payload = JSON.stringify({ rows, sheetName });
      
      console.log(`Saving to Supabase...`);
      // Check if exists
      const { data: existing } = await supabaseAdminClient
        .from('dashboard_data')
        .select('id')
        .eq('key', 'static_stages')
        .eq('field', stage.gid)
        .maybeSingle();
        
      if (existing) {
        await supabaseAdminClient
          .from('dashboard_data')
          .update({ value: payload })
          .eq('key', 'static_stages')
          .eq('field', stage.gid);
        console.log(`[UPDATE] Saved ${stage.label} successfully.`);
      } else {
        await supabaseAdminClient
          .from('dashboard_data')
          .insert({ key: 'static_stages', field: stage.gid, value: payload });
        console.log(`[INSERT] Saved ${stage.label} successfully.`);
      }
      
    } catch(err) {
      console.error(`Failed to migrate ${stage.label}:`, err.message);
    }
  }
  
  console.log("\n✅ Migration completed!");
}

migrate();
