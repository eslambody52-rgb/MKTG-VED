import { useState, useEffect } from 'react';

// Mapping based on your Google Apps Script and sheet structure
export const mapSheetRow = (row: any[], gid: string) => {
  if (gid === '1535230545') {
    return {
      id: '',
      name: row[1] || 'بدون اسم',
      opSheet: row[2] || '',
      branch: row[3] || '',
      notesMarketing: row[4] || '',
      editor: row[5] || '',
      done: row[6] === 'TRUE',
      notesEditors: row[7] || '',
      priority: row[8] === 'TRUE',
    };
  }

  if (gid === '2086331904') {
    return {
      date: row[0] || '',
      term: row[1] || '',
      year: row[2] || '',
      teacher: row[3] || '',
      name: row[4] || 'بدون اسم',
      filingName: row[5] || '',
      smartboard: row[6] || '',
      id: row[3] || '',
    };
  }

  // Junior / Middle / Senior
  return {
    week: row[0] || '',
    date: row[2] || row[1] || '',
    id: row[2] || row[1] || '',
    subject: row[3] || '',
    extra: row[4] || '',
    branch: row[4] || '',
    filingName: row[5] || '',
    name: row[6] || row[5] || 'بدون اسم',
    val: row[7] || '',
    opSheet: row[7] || '',
    check1: row[8] === 'TRUE' || row[9] === 'TRUE',
    check2: row[9] === 'TRUE' || row[10] === 'TRUE',
  };
};

const DEFAULT_PUBLISHED_ID = '2PACX-1vRuuQ4J0z5ze6hHeZIvM24VqPApNS_eHIvnBmZ4EyPWj7J1MpvBOyPodwx0DKa1yqNkjlFdahgN6jZI';
const OPERATIONS_GID = '2086331904';

export function useGoogleSheets(gid: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      let rows: any[][] = [];

      if (gid === OPERATIONS_GID) {
        // ── Private sheet → call our Vercel API route, fallback to static test.json on static hosts (e.g. GitHub Pages) ─────────────────────
        try {
          const res = await fetch(`/api/sheet?gid=${gid}&t=${Date.now()}`);
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            rows = json.rows || [];
          } catch(e) {
            throw new Error('Not JSON response');
          }
        } catch(err) {
          console.log('[Fallback] Loading static test.json for Operations sheet (GitHub Pages mode)');
          const fallbackRes = await fetch('./test.json');
          if (fallbackRes.ok) {
            const json = await fallbackRes.json();
            rows = json.rows || [];
          }
        }
      } else {
        // ── Public published sheet → direct CSV fetch ─────────────────────
        const url = `https://docs.google.com/spreadsheets/d/e/${DEFAULT_PUBLISHED_ID}/pub?gid=${gid}&output=csv&single=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
        const text = await res.text();

        // Robust CSV parse (respects newlines and commas inside quotes)
        rows = [];
        let currentRow: string[] = [];
        let currentCell = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Escaped quote
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
            // Ignore \r
          } else {
            currentCell += char;
          }
        }
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
        }
      }

      let lastWeek = '';
      let lastDate = '';
      let lastSubject = '';
      let lastBranch = '';

      const parsedData = rows
        .slice(1) // skip header
        .map((row) => {
          const item = mapSheetRow(row, gid);
          
          // Carry over values for merged cells in Stage sheets
          if (gid !== '2086331904' && gid !== '1535230545') {
            if (item.week) lastWeek = item.week; else item.week = lastWeek;
            if (item.date) lastDate = item.date; else { item.date = lastDate; item.id = lastDate; }
            if (item.subject) lastSubject = item.subject; else item.subject = lastSubject;
            if (item.extra) lastBranch = item.extra; else { item.extra = lastBranch; item.branch = lastBranch; }
          }
          
          return item;
        })
        .filter((item: any) => {
          if (!item.name || item.name === 'بدون اسم') return false;
          
          // Ignore header rows that sometimes appear in the data
          if (String(item.name).trim().toUpperCase() === 'OP NAME') return false;

          // Fallback client-side filter for Q items
          const qRegex = /Q\s*\d+[^a-zA-Z0-9]*$/i;
          if (qRegex.test(String(item.name).trim())) return false;
          if (item.filingName && qRegex.test(String(item.filingName).trim())) return false;
          
          return true;
        });

      setData(parsedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gid) fetchData();
  }, [gid]);

  return { data, loading, error, refresh: fetchData };
}
