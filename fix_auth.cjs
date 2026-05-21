const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /fetch\('\/api\/task-metadata', \{\s*method: 'PUT',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{ field, metadata: dict \}\)\s*\}\)\.catch\(e => console\.error\(e\)\);/,
  `if (session?.access_token) {
      fetch('/api/task-metadata', {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${session.access_token}\` },
         body: JSON.stringify({ field, metadata: dict })
      }).catch(e => console.error(e));
    }`
);

content = content.replace(
  /fetch\('\/api\/task-metadata'\)\s*\.then\(res => res\.json\(\)\)\s*\.then\(data => \{/,
  `if (!session?.access_token) return;
    fetch('/api/task-metadata', {
      headers: { 'Authorization': \`Bearer \${session.access_token}\` }
    })
      .then(res => res.json())
      .then(data => {`
);

content = content.replace(
  /useEffect\(\(\) => \{[\s\S]*?fetch\('\/api\/task-metadata'[\s\S]*?\}, \[\]\);/,
  function(match) {
    return match.replace(/\[\]\);$/, `[session?.access_token]);`);
  }
);

content = content.replace(
  /fetch\('\/api\/task-metadata', \{ method: 'PUT', headers: \{ 'Content-Type': 'application\/json' \}, body: JSON\.stringify\(\{ field: 'editor_notes', metadata: updated \}\) \}\)/g,
  `fetch('/api/task-metadata', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${session?.access_token}\` }, body: JSON.stringify({ field: 'editor_notes', metadata: updated }) })`
);

content = content.replace(
  /fetch\('\/api\/task-metadata', \{ method: 'PUT', headers: \{ 'Content-Type': 'application\/json' \}, body: JSON\.stringify\(\{ field: 'marketing_notes', metadata: updated \}\) \}\)/g,
  `fetch('/api/task-metadata', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${session?.access_token}\` }, body: JSON.stringify({ field: 'marketing_notes', metadata: updated }) })`
);


fs.writeFileSync(filePath, content, 'utf8');
console.log("App.tsx fetch auth patched successfully!");
