import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Task } from '../types';

// Replace this with your "Publish to web" CSV URL from Google Sheets
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSXXXXXXXX/pub?output=csv';

export function useGoogleSheets() {
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // In a real scenario, we fetch the CSV
      // For now, we'll simulate the fetch if the URL is placeholder
      if (SHEET_CSV_URL.includes('XXXXXXXX')) {
        console.warn('Google Sheets URL is a placeholder. Using mock data.');
        setLoading(false);
        return;
      }

      Papa.parse(SHEET_CSV_URL, {
        download: true,
        header: true,
        complete: (results) => {
          const parsedTasks: Task[] = results.data.map((row: any, index: number) => ({
            id: String(index),
            videoName: row['Project Name'] || row['Video Name'] || 'Unknown',
            requirements: row['Requirements'] || row['Notes'] || '',
            status: (row['Status'] as any) || 'Pending',
            responsible: row['Responsible'] || row['WHO'] || '',
            branch: row['Branch'] || '',
            date: row['Date'] || '',
            year: parseInt(row['Year']) || new Date().getFullYear(),
          }));
          setData(parsedTasks);
          setLoading(false);
        },
        error: (err: any) => {
          setError(err.message);
          setLoading(false);
        }
      });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
}
