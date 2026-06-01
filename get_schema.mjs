import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dppdaqmrrjbldcygadpi.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGRhcW1ycmpibGRjeWdhZHBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIzNTIyNSwiZXhwIjoyMDk0ODExMjI1fQ.EBZ2wyV48UA9h9tLM0vUrjovR8xCb8lPLIaVgI9aVwU';

async function getSchema() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseServiceRoleKey}`);
  const schema = await res.json();
  console.log('Shooting columns definition:', schema.definitions?.shooting?.properties);
}

getSchema();
