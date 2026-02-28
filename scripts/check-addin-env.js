#!/usr/bin/env node
/**
 * Check that Word Add-in has Airia env vars set (for E2E with Airia).
 * The add-in only reads from apps/word-addin/.env.local (and .env); root .env.local is not used by Vite.
 * Run from repo root: node scripts/check-addin-env.js
 * Exits 0 if OK, 1 and prints what's missing or wrong otherwise.
 */
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const addinDir = path.join(rootDir, 'apps', 'word-addin');
const addinEnvLocal = path.join(addinDir, '.env.local');
const addinEnv = path.join(addinDir, '.env');
const rootEnvLocal = path.join(rootDir, '.env.local');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const out = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function isPlaceholder(val) {
  if (!val || typeof val !== 'string') return true;
  const v = val.trim().toLowerCase();
  return v === '' || v === 'your_api_key_here' || v === 'your_agent_id_here' || v.startsWith('your_');
}

// Add-in env only (this is what Vite loads)
const addinEnvVars = { ...readEnvFile(addinEnv), ...readEnvFile(addinEnvLocal) };
const rootEnvVars = readEnvFile(rootEnvLocal);

const hasProxy = !!addinEnvVars.VITE_AIRIA_PROXY_URL && !isPlaceholder(addinEnvVars.VITE_AIRIA_PROXY_URL);
const hasDirect =
  !!addinEnvVars.VITE_AIRIA_API_URL &&
  !!addinEnvVars.VITE_AIRIA_API_KEY &&
  !!addinEnvVars.VITE_AIRIA_AGENT_ID &&
  !isPlaceholder(addinEnvVars.VITE_AIRIA_API_URL) &&
  !isPlaceholder(addinEnvVars.VITE_AIRIA_API_KEY) &&
  !isPlaceholder(addinEnvVars.VITE_AIRIA_AGENT_ID);

if (hasProxy || hasDirect) {
  console.log('OK: Airia config found in apps/word-addin/.env.local (or .env). Ready for add-in testing.');
  process.exit(0);
}

// Helpful message if vars exist only in root
const rootHasProxy = !!rootEnvVars.VITE_AIRIA_PROXY_URL && !isPlaceholder(rootEnvVars.VITE_AIRIA_PROXY_URL);
const rootHasDirect =
  !!rootEnvVars.VITE_AIRIA_API_URL &&
  !!rootEnvVars.VITE_AIRIA_API_KEY &&
  !!rootEnvVars.VITE_AIRIA_AGENT_ID &&
  !isPlaceholder(rootEnvVars.VITE_AIRIA_API_KEY) &&
  !isPlaceholder(rootEnvVars.VITE_AIRIA_AGENT_ID);

if (rootHasProxy || rootHasDirect) {
  console.error('Airia vars are set in root .env.local, but the Word Add-in loads env from apps/word-addin/.env.local.');
  console.error('Copy the VITE_AIRIA_* lines (uncommented) into apps/word-addin/.env.local, e.g.:');
  console.error('  cp .env.local apps/word-addin/.env.local');
  console.error('  # or copy only the VITE_AIRIA_* lines and uncomment them in apps/word-addin/.env.local');
  process.exit(1);
}

console.error('Missing Airia config for the Word Add-in.');
console.error('In apps/word-addin/.env.local set either:');
console.error('  VITE_AIRIA_PROXY_URL=https://your-proxy.example.com/airia');
console.error('Or all three (uncommented, with real values):');
console.error('  VITE_AIRIA_API_URL=https://api.airia.ai');
console.error('  VITE_AIRIA_API_KEY=your_api_key_from_dashboard');
console.error('  VITE_AIRIA_AGENT_ID=your_agent_id_from_dashboard');
console.error('See .env.example and E2E_SETUP_AND_TEST_WITH_AIRIA.md');
process.exit(1);
