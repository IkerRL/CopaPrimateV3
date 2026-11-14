import fs from 'fs';
import path from 'path';

export const ROOT_DIR = process.cwd();

export const LEGACY_TOKENS = [
  'wood',
  'banana',
  '#4e2e1a',
  '#27140b',
  '#795548',
  '#2e7d32',
  '#ffa000',
  '#ffb300',
  '/monkeys.jpg',
  '/gorilas.jpg',
];

export const FUSION_COLORS = {
  purple: '#c084fc',
  cyan: '#00f5d4',
  dark: '#08080b',
};

export const WEBSITE_OVERLAY_FILES = [
  'website/src/pages/overlays/OverlayLive.jsx',
  'website/src/pages/overlays/OverlayScoreboard.jsx',
  'website/src/pages/overlays/OverlayMatchup.jsx',
  'website/src/pages/overlays/OverlayRoulette.jsx',
  'website/src/pages/overlays/OverlayTicker.jsx',
  'website/src/pages/overlays/marcador.css',
  'website/src/pages/overlays/ruleta.css',
];

export const DASHBOARD_OVERLAY_FILES = [
  'dashboard/src/components/overlays/OverlayLive.jsx',
  'dashboard/src/components/overlays/OverlayScoreboard.jsx',
  'dashboard/src/components/overlays/OverlayMatchup.jsx',
  'dashboard/src/components/overlays/OverlayRoulette.jsx',
  'dashboard/src/components/overlays/OverlayTicker.jsx',
  'dashboard/src/components/overlays/marcador.css',
  'dashboard/src/components/overlays/ruleta.css',
];

export function readFileSafe(relPath) {
  const fullPath = path.resolve(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Searches a text string for legacy tokens.
 * Hex colors are checked case-insensitively.
 * String literals (wood, banana, etc.) are checked case-insensitively.
 */
export function findLegacyTokens(text, tokens = LEGACY_TOKENS) {
  const lower = text.toLowerCase();
  const matches = [];

  for (const token of tokens) {
    const tLower = token.toLowerCase();
    let idx = 0;
    while ((idx = lower.indexOf(tLower, idx)) !== -1) {
      // Find line number
      const line = text.slice(0, idx).split('\n').length;
      matches.push({ token, line, index: idx });
      idx += tLower.length;
    }
  }

  return matches;
}

/**
 * Light test suite context to aggregate results.
 */
export class TestRunnerContext {
  constructor(name) {
    this.name = name;
    this.results = [];
  }

  async runTest(name, fn) {
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      this.results.push({ name, status: 'PASS', duration });
    } catch (err) {
      const duration = Date.now() - start;
      this.results.push({
        name,
        status: 'FAIL',
        duration,
        error: err.message,
        stack: err.stack,
      });
    }
  }

  summary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    return { name: this.name, passed, failed, total, results: this.results };
  }
}
