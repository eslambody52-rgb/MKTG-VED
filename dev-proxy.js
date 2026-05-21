// Local development proxy for the Sheets API
// Run with: node dev-proxy.js
import express from 'express';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadEnvFile = (filename) => {
  try {
    const content = readFileSync(join(__dirname, filename), 'utf8');
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
    // Optional local env file.
  }
};

loadEnvFile('.env');
loadEnvFile('.env.local');

// Cache and background fetching system for BunnyCDN durations
import { existsSync, writeFileSync } from 'fs';
const cachePath = join(__dirname, 'bunny_durations.json');
let bunnyCache = {};
try {
  if (existsSync(cachePath)) {
    bunnyCache = JSON.parse(readFileSync(cachePath, 'utf8'));
  }
} catch (e) {
  console.error('[Cache] Failed to load bunny_durations.json:', e);
}

const saveCache = () => {
  try {
    writeFileSync(cachePath, JSON.stringify(bunnyCache, null, 2), 'utf8');
  } catch (e) {
    console.error('[Cache] Failed to save bunny_durations.json:', e);
  }
};

const fetchQueue = new Set();
let isFetching = false;

const formatSeconds = (totalSeconds) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const formattedHrs = hrs > 0 ? `${hrs}:` : '';
  const formattedMins = String(mins).padStart(hrs > 0 ? 2 : 1, '0');
  const formattedSecs = String(secs).padStart(2, '0');
  return `${formattedHrs}${formattedMins}:${formattedSecs}`;
};

const processQueue = async () => {
  if (isFetching || fetchQueue.size === 0) return;
  isFetching = true;
  const nextUrl = fetchQueue.values().next().value;
  fetchQueue.delete(nextUrl);
  try {
    const res = await fetch(nextUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    const text = await res.text();
    const durationMatch = text.match(/<meta property="video:duration" content="(\d+)">/i);
    if (durationMatch) {
      const seconds = parseInt(durationMatch[1], 10);
      if (!isNaN(seconds) && seconds > 0) {
        const formatted = formatSeconds(seconds);
        bunnyCache[nextUrl] = formatted;
        console.log(`[Cache] Fetched duration for: ${nextUrl} -> ${formatted}`);
        saveCache();
      }
    } else {
      const schemaMatch = text.match(/"duration"\s*:\s*"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/i);
      if (schemaMatch) {
        const hrs = parseInt(schemaMatch[1] || '0', 10);
        const mins = parseInt(schemaMatch[2] || '0', 10);
        const secs = parseInt(schemaMatch[3] || '0', 10);
        const totalSecs = hrs * 3600 + mins * 60 + secs;
        if (totalSecs > 0) {
          const formatted = formatSeconds(totalSecs);
          bunnyCache[nextUrl] = formatted;
          console.log(`[Cache] Fetched duration (schema) for: ${nextUrl} -> ${formatted}`);
          saveCache();
        }
      }
    }
  } catch (e) {
    console.error(`[Cache] Error fetching metadata for ${nextUrl}:`, e.message);
  }
  isFetching = false;
  setTimeout(processQueue, 300);
};

const queueFetch = (url) => {
  if (bunnyCache[url] || fetchQueue.has(url)) return;
  fetchQueue.add(url);
  processQueue();
};

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAuthClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
const supabaseAdminClient = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const allowedRoles = new Set(['admin', 'manager', 'supervisor', 'junior']);

const getRequesterProfile = async (req) => {
  if (!supabaseAuthClient || !supabaseAdminClient) {
    throw new Error('Missing Supabase server configuration. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  }

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const err = new Error('Missing authorization token');
    err.status = 401;
    throw err;
  }

  const { data: userData, error: userError } = await supabaseAuthClient.auth.getUser(token);
  if (userError || !userData.user) {
    const err = new Error('Invalid authorization token');
    err.status = 401;
    throw err;
  }

  const { data: profile, error: profileError } = await supabaseAdminClient
    .from('user_profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile) {
    const err = new Error('Requester profile was not found');
    err.status = 403;
    throw err;
  }

  if (!profile.is_active || !['admin', 'manager'].includes(profile.role)) {
    const err = new Error('Only admin and manager users can manage users');
    err.status = 403;
    throw err;
  }

  return profile;
};

const assertCanManageTarget = (requester, targetRole, existingTarget) => {
  if (!allowedRoles.has(targetRole)) {
    const err = new Error('Invalid role');
    err.status = 400;
    throw err;
  }

  if (requester.role === 'manager') {
    if (targetRole === 'admin' || existingTarget?.role === 'admin') {
      const err = new Error('Managers cannot create or edit admin users');
      err.status = 403;
      throw err;
    }
  }
};

const handleApiError = (res, err) => {
  const status = err.status || 500;
  console.error('[Users API]', err.message);
  res.status(status).json({ error: err.message || 'Unexpected server error' });
};

app.post('/api/users', async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    const rawLogin = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim();
    const password = String(req.body.password || '');
    const role = String(req.body.role || 'junior');
    const allowed_tabs = Array.isArray(req.body.allowed_tabs) ? req.body.allowed_tabs : [];

    if (!rawLogin || !name || password.length < 6) {
      const err = new Error('Name, login, and a 6+ character password are required');
      err.status = 400;
      throw err;
    }

    const email = rawLogin.includes('@')
      ? rawLogin
      : `${rawLogin.replace(/[^a-z0-9._-]/g, '') || 'user'}@local.user`;

    assertCanManageTarget(requester, role);

    const { data, error } = await supabaseAdminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });
    if (error) throw error;

    const { error: profileError } = await supabaseAdminClient
      .from('user_profiles')
      .upsert({
        id: data.user.id,
        email,
        name,
        role,
        allowed_tabs: role === 'supervisor' ? allowed_tabs : [],
        is_active: true,
      });
    if (profileError) throw profileError;

    res.status(201).json({ user: data.user });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    await getRequesterProfile(req);
    const { data, error } = await supabaseAdminClient
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ users: data || [] });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/permissions', async (req, res) => {
  try {
    await getRequesterProfile(req);
    const { data, error } = await supabaseAdminClient
      .from('dashboard_data')
      .select('*')
      .eq('key', 'permissions_v1')
      .eq('field', 'roles')
      .maybeSingle();
    if (error) throw error;
    const parsed = data?.value ? JSON.parse(data.value) : null;
    res.json({ permissions: parsed });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.put('/api/permissions', async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    if (requester.role !== 'admin') {
      const err = new Error('Only admin can update role permissions');
      err.status = 403;
      throw err;
    }
    const value = JSON.stringify(req.body.permissions || {});
    const { error } = await supabaseAdminClient
      .from('dashboard_data')
      .upsert({
        key: 'permissions_v1',
        field: 'roles',
        value,
        updated_by: requester.id,
      });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.get('/api/task-metadata', async (req, res) => {
  try {
    await getRequesterProfile(req);
    const { data, error } = await supabaseAdminClient
      .from('dashboard_data')
      .select('field, value')
      .eq('key', 'task_metadata');
    if (error) throw error;
    
    const metadata = {};
    if (data) {
      data.forEach(row => {
        try {
          metadata[row.field] = JSON.parse(row.value);
        } catch(e) {}
      });
    }
    res.json({ metadata });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.put('/api/task-metadata', async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    const { field, metadata } = req.body;
    if (!field) throw new Error('field is required');
    
    const value = JSON.stringify(metadata || {});
    const { error } = await supabaseAdminClient
      .from('dashboard_data')
      .upsert({
        key: 'task_metadata',
        field: field,
        value,
        updated_by: requester.id,
      }, { onConflict: 'key,field' });
      
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.post('/api/resolve-login', async (req, res) => {
  try {
    const raw = String(req.body.identifier || '').trim().toLowerCase();
    if (!raw) return res.status(400).json({ error: 'Missing identifier' });

    const { data, error } = await supabaseAdminClient
      .from('user_profiles')
      .select('email,name')
      .or(`name.ilike.%${raw}%,email.ilike.${raw}@local.user,email.ilike.${raw}%`)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data?.email) return res.status(404).json({ error: 'User not found' });

    return res.json({ email: String(data.email).toLowerCase(), name: data.name || null });
  } catch (err) {
    handleApiError(res, err);
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const requester = await getRequesterProfile(req);
    const targetId = String(req.params.id || '');
    const { data: target, error: targetError } = await supabaseAdminClient
      .from('user_profiles')
      .select('*')
      .eq('id', targetId)
      .single();
    if (targetError || !target) {
      const err = new Error('Target user was not found');
      err.status = 404;
      throw err;
    }

    const updates = {};
    if (typeof req.body.name === 'string') updates.name = req.body.name.trim();
    if (typeof req.body.email === 'string') updates.email = req.body.email.trim().toLowerCase();
    if (typeof req.body.is_active === 'boolean') updates.is_active = req.body.is_active;
    if (Array.isArray(req.body.allowed_tabs)) updates.allowed_tabs = req.body.allowed_tabs;
    if (typeof req.body.role === 'string') updates.role = req.body.role;

    const nextRole = updates.role || target.role;
    assertCanManageTarget(requester, nextRole, target);
    if (updates.role && updates.role !== 'supervisor') updates.allowed_tabs = [];

    const { data, error } = await supabaseAdminClient
      .from('user_profiles')
      .update(updates)
      .eq('id', targetId)
      .select()
      .single();
    if (error) throw error;

    res.json({ user: data });
  } catch (err) {
    handleApiError(res, err);
  }
});

const getSpreadsheetId = (gid) => {
  const g = String(gid || '');
  if (g === '1476192399' || g === '2086331904') {
    return '1Hm7noXxv8ITMU3dNXQmqFEzfZY1mZlBJ4bQ9_ZIR0-M';
  }
  return '1lh0-kh9MlT4AZCi3-QBn0fkkiNpMcpg6qcoDfBeNK8g';
};

// Load credentials from JSON file directly (local dev only)
const keyFile = join(__dirname, 'sapient-flight-495410-s3-7ebddbbb3300.json');
const credentials = JSON.parse(readFileSync(keyFile, 'utf-8'));

app.get('/api/duration', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  const strUrl = String(url);
  if (bunnyCache[strUrl]) {
    return res.json({ duration: bunnyCache[strUrl] });
  }
  try {
    const response = await fetch(strUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    const text = await response.text();
    const durationMatch = text.match(/<meta property="video:duration" content="(\d+)">/i);
    if (durationMatch) {
      const seconds = parseInt(durationMatch[1], 10);
      if (!isNaN(seconds) && seconds > 0) {
        const formatted = formatSeconds(seconds);
        bunnyCache[strUrl] = formatted;
        console.log(`[API] On-demand fetched: ${strUrl} -> ${formatted}`);
        saveCache();
        return res.json({ duration: formatted });
      }
    }
    const schemaMatch = text.match(/"duration"\s*:\s*"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/i);
    if (schemaMatch) {
      const hrs = parseInt(schemaMatch[1] || '0', 10);
      const mins = parseInt(schemaMatch[2] || '0', 10);
      const secs = parseInt(schemaMatch[3] || '0', 10);
      const totalSecs = hrs * 3600 + mins * 60 + secs;
      if (totalSecs > 0) {
        const formatted = formatSeconds(totalSecs);
        bunnyCache[strUrl] = formatted;
        console.log(`[API] On-demand fetched (schema): ${strUrl} -> ${formatted}`);
        saveCache();
        return res.json({ duration: formatted });
      }
    }
    return res.json({ duration: '' });
  } catch (e) {
    console.error(`[API] Error on-demand duration for ${strUrl}:`, e.message);
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/sheet', async (req, res) => {
  const { gid } = req.query;
  console.log(`[API] Requested GID: ${gid}`);
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    console.log('[API] Auth initialized');

    const sheets = google.sheets({ version: 'v4', auth });
    const targetSpreadsheetId = getSpreadsheetId(gid);

    console.log('[API] Fetching spreadsheet metadata...');
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: targetSpreadsheetId });
    console.log('[API] Fetched metadata successfully');
    
    const sheetMeta = spreadsheet.data.sheets?.find(
      (s) => String(s.properties?.sheetId) === String(gid)
    );

    if (!sheetMeta?.properties?.title) {
      console.log(`[API] Error: Sheet GID ${gid} not found`);
      return res.status(404).json({ error: `Sheet GID ${gid} not found` });
    }

    console.log(`[API] Fetching values for range: ${sheetMeta.properties.title}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: targetSpreadsheetId,
      range: sheetMeta.properties.title,
    });
    console.log(`[API] Fetched values: ${response.data.values?.length || 0} rows`);
    
    // Filter out rows that are entirely empty or just contain whitespace
    let validRows = (response.data.values || []).filter(row => 
      row.some(cell => cell && String(cell).trim() !== '')
    );
    
    // Performance optimization for large sheets
    if (String(gid) === '1476192399' || String(gid) === '2086331904') {
      const isNewGid = String(gid) === '1476192399';
      validRows = validRows
        .map(row => {
          if (isNewGid) {
            const sliced = row.slice(0, 21);
            while (sliced.length < 21) sliced.push('');
            let linkBunny = sliced[17] || '';
            // Fallback: extract play URL from iframe embed in col 16 if col 17 is empty
            if (!linkBunny && sliced[16]) {
              const m = String(sliced[16]).match(/mediadelivery\.net\/embed\/(\d+)\/([a-f0-9-]+)/i);
              if (m) {
                linkBunny = `https://iframe.mediadelivery.net/play/${m[1]}/${m[2]}`;
                sliced[17] = linkBunny;
              }
            }
            if (linkBunny && bunnyCache[linkBunny]) {
              sliced[20] = bunnyCache[linkBunny];
            } else if (linkBunny) {
              queueFetch(linkBunny);
            }
            return sliced;
          } else {
            return row.slice(0, 7);
          }
        })
        .filter(row => {
          const nameIdx = isNewGid ? 11 : 4;
          const filingIdx = isNewGid ? 12 : 5;
          if (!row[nameIdx] || row[nameIdx] === 'بدون اسم') return false;
          // Filter out rows ending with Q and a number, optionally followed by closing brace (e.g., Q1, Q20, Q20})
          const qRegex = /Q\s*\d+[^a-zA-Z0-9]*$/i;
          if (qRegex.test(String(row[nameIdx]).trim()) || (row[filingIdx] && qRegex.test(String(row[filingIdx]).trim()))) {
            return false;
          }
          return true;
        });
    }
    
    console.log(`[API] Filtered to ${validRows.length} valid rows`);

    res.json({ rows: validRows, sheetName: sheetMeta.properties.title });
  } catch (err) {
    console.error('[API] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('✅ Dev API proxy running on http://localhost:3001'));

