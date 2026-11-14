import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const DATA_FILES = [
  'live-match.json',
  'overlay-state.json',
  'matches.json',
  'teams.json',
  'web-settings.json',
];

const backups = new Map();

export function backupDataFiles() {
  for (const file of DATA_FILES) {
    const fullPath = path.join(ROOT_DIR, file);
    if (fs.existsSync(fullPath)) {
      backups.set(file, fs.readFileSync(fullPath, 'utf8'));
    } else {
      backups.set(file, null);
    }
  }
}

export function restoreDataFiles() {
  for (const [file, content] of backups.entries()) {
    const fullPath = path.join(ROOT_DIR, file);
    try {
      if (content === null) {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } else {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    } catch (err) {
      console.warn(`[data-backup] Error restoring ${file}:`, err.message);
    }
  }
}

// Clean up on exit or unhandled termination
process.on('exit', () => {
  restoreDataFiles();
});
