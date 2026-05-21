import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dppdaqmrrjbldcygadpi.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGRhcW1ycmpibGRjeWdhZHBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIzNTIyNSwiZXhwIjoyMDk0ODExMjI1fQ.EBZ2wyV48UA9h9tLM0vUrjovR8xCb8lPLIaVgI9aVwU';
const DEFAULT_PASSWORD = '123456';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  'ABANOUB', 'ASHRAF', 'Basel', 'ESLAM', 'HASSANEN',
  'KIRO', 'MAGED', 'MOHAMED', 'Ramaj', 'SHIHAB', 'WAEL'
];

async function createUsers() {
  console.log(`\n🚀 Creating ${users.length} junior users...\n`);
  
  for (const name of users) {
    const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@local.user`;
    
    try {
      // Create auth user
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { name, role: 'junior' },
      });

      if (error) {
        if (error.message?.includes('already been registered')) {
          console.log(`⚠️  ${name} already exists, skipping...`);
        } else {
          console.log(`❌ ${name}: ${error.message}`);
        }
        continue;
      }

      // Insert into user_profiles
      const { error: profileError } = await admin.from('user_profiles').upsert({
        id: data.user.id,
        email,
        name,
        role: 'junior',
        allowed_tabs: [],
        is_active: true,
      });

      if (profileError) {
        console.log(`⚠️  ${name} auth created but profile failed: ${profileError.message}`);
      } else {
        console.log(`✅ ${name} → ${email} (password: ${DEFAULT_PASSWORD})`);
      }

    } catch (err) {
      console.log(`❌ ${name}: ${err.message}`);
    }
  }

  console.log('\n✨ Done! All users processed.');
  console.log(`\n📋 Default password for all: "${DEFAULT_PASSWORD}"`);
}

createUsers();
