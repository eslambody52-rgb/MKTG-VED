const fs = require('fs');
const path = require('path');

// Fix dev-proxy.js
const proxyPath = path.join(__dirname, 'dev-proxy.js');
let proxyContent = fs.readFileSync(proxyPath, 'utf8');

proxyContent = proxyContent.replace(
  /const \{ error \} = await supabaseAdminClient[\s\S]*?\.upsert\(\{[\s\S]*?key: 'task_metadata',[\s\S]*?field: field,[\s\S]*?value,[\s\S]*?updated_by: requester\.id,[\s\S]*?\}, \{ onConflict: 'key,field' \}\);/,
  `// Check if exists
    const { data: existing } = await supabaseAdminClient
      .from('dashboard_data')
      .select('id')
      .eq('key', 'task_metadata')
      .eq('field', field)
      .maybeSingle();

    let error;
    if (existing) {
      const res = await supabaseAdminClient
        .from('dashboard_data')
        .update({ value, updated_by: requester.id })
        .eq('id', existing.id);
      error = res.error;
    } else {
      const res = await supabaseAdminClient
        .from('dashboard_data')
        .insert({ key: 'task_metadata', field, value, updated_by: requester.id });
      error = res.error;
    }`
);
fs.writeFileSync(proxyPath, proxyContent, 'utf8');

// Fix api/task-metadata.ts
const vercelPath = path.join(__dirname, 'api', 'task-metadata.ts');
if (fs.existsSync(vercelPath)) {
  let vercelContent = fs.readFileSync(vercelPath, 'utf8');
  vercelContent = vercelContent.replace(
    /const \{ error \} = await supabaseAdminClient[\s\S]*?\.upsert\(\{[\s\S]*?key: 'task_metadata',[\s\S]*?field: field,[\s\S]*?value,[\s\S]*?updated_by: requester\.id,[\s\S]*?\}, \{ onConflict: 'key,field' \}\);/,
    `// Check if exists
      const { data: existing } = await supabaseAdminClient
        .from('dashboard_data')
        .select('id')
        .eq('key', 'task_metadata')
        .eq('field', field)
        .maybeSingle();

      let error;
      if (existing) {
        const res = await supabaseAdminClient
          .from('dashboard_data')
          .update({ value, updated_by: requester.id })
          .eq('id', existing.id);
        error = res.error;
      } else {
        const res = await supabaseAdminClient
          .from('dashboard_data')
          .insert({ key: 'task_metadata', field, value, updated_by: requester.id });
        error = res.error;
      }`
  );
  fs.writeFileSync(vercelPath, vercelContent, 'utf8');
}

console.log("Upsert replaced successfully!");
