import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1lh0-kh9MlT4AZCi3-QBn0fkkiNpMcpg6qcoDfBeNK8g';

function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  let formatted = key.replace(/"/g, '').trim();
  formatted = formatted.replace(/\\n/g, '\n');
  
  // If newlines were stripped, rebuild the PEM format
  if (!formatted.includes('\n')) {
    const beginHeader = '-----BEGIN PRIVATE KEY-----';
    const endHeader = '-----END PRIVATE KEY-----';
    if (formatted.includes(beginHeader) && formatted.includes(endHeader)) {
      let body = formatted.substring(
        formatted.indexOf(beginHeader) + beginHeader.length,
        formatted.indexOf(endHeader)
      );
      body = body.replace(/\s+/g, '');
      const matchedBody = body.match(/.{1,64}/g);
      const bodyLines = matchedBody ? matchedBody.join('\n') : body;
      formatted = `${beginHeader}\n${bodyLines}\n${endHeader}`;
    }
  }
  return formatted;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { gid } = req.query;

  try {
    // Authenticate using Service Account credentials from environment variables
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL?.replace(/"/g, '').trim(),
        private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get all sheet names to find the one with matching GID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    // Find sheet name by GID
    const sheetMeta = spreadsheet.data.sheets?.find(
      (s) => String(s.properties?.sheetId) === String(gid)
    );

    if (!sheetMeta?.properties?.title) {
      return res.status(404).json({ error: `Sheet with GID ${gid} not found` });
    }

    const sheetName = sheetMeta.properties.title;

    // Fetch the data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });

    const rows = response.data.values || [];
    
    // Filter out rows that are entirely empty or just contain whitespace
    let validRows = rows.filter((row: any[]) => 
      row.some(cell => cell && String(cell).trim() !== '')
    );
    
    // Performance optimization for large sheets
    if (String(gid) === '2086331904') {
      validRows = validRows
        .map((row: any[]) => row.slice(0, 7)) // Only need first 7 columns
        .filter((row: any[]) => {
          if (!row[4] || row[4] === 'بدون اسم') return false;
          // Filter out rows ending with Q and a number, optionally followed by closing brace (e.g., Q1, Q20, Q20})
          const qRegex = /Q\s*\d+[^a-zA-Z0-9]*$/i;
          if (qRegex.test(String(row[4]).trim()) || (row[5] && qRegex.test(String(row[5]).trim()))) {
            return false;
          }
          return true;
        });
    }
    
    return res.status(200).json({ rows: validRows, sheetName });

  } catch (err: any) {
    console.error('Sheets API error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
