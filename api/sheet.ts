import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

const getSpreadsheetId = (gid: any) => {
  const g = String(gid || '');
  if (g === '1476192399' || g === '2086331904') {
    return '1Hm7noXxv8ITMU3dNXQmqFEzfZY1mZlBJ4bQ9_ZIR0-M';
  }
  return '1lh0-kh9MlT4AZCi3-QBn0fkkiNpMcpg6qcoDfBeNK8g';
};

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
    const targetSpreadsheetId = getSpreadsheetId(gid);

    // Get all sheet names to find the one with matching GID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: targetSpreadsheetId,
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
      spreadsheetId: targetSpreadsheetId,
      range: sheetName,
    });

    const rows = response.data.values || [];
    
    // Filter out rows that are entirely empty or just contain whitespace
    let validRows = rows.filter((row: any[]) => 
      row.some(cell => cell && String(cell).trim() !== '')
    );
    
    // Performance optimization for large sheets
    if (String(gid) === '1476192399' || String(gid) === '2086331904') {
      const isNewGid = String(gid) === '1476192399';
      validRows = validRows
        .map((row: any[]) => {
          if (isNewGid) {
            const sliced = row.slice(0, 21);
            while (sliced.length < 21) sliced.push('');
            // Fallback: extract play URL from iframe embed in col 16 if col 17 is empty
            if (!sliced[17] && sliced[16]) {
              const m = String(sliced[16]).match(/mediadelivery\.net\/embed\/(\d+)\/([a-f0-9-]+)/i);
              if (m) {
                sliced[17] = `https://iframe.mediadelivery.net/play/${m[1]}/${m[2]}`;
              }
            }
            return sliced;
          } else {
            return row.slice(0, 7);
          }
        })
        .filter((row: any[]) => {
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
    
    return res.status(200).json({ rows: validRows, sheetName });

  } catch (err: any) {
    console.error('Sheets API error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
