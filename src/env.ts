import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Load .env File ──────────────────────────────────────────────────────────
// Must run before any config imports so process.env is populated.

try {
  const envPath = resolve(process.cwd(), '.env');
  const envFile = readFileSync(envPath, 'utf-8');

  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    process.env[key] = value;
  }
} catch {
  // .env file not found — use existing environment variables
}
