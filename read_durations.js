import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cachePath = join(__dirname, 'bunny_durations.json');

if (existsSync(cachePath)) {
  console.log('File content:', readFileSync(cachePath, 'utf8'));
} else {
  console.log('File does NOT exist!');
}
