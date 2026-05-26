import 'dotenv/config';
import { readFile } from 'node:fs/promises';

const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');

async function main() {
  const raw = await readFile('data/live/wc26/schedule.normalized.json', 'utf8');
  const payload = JSON.parse(raw) as { matches: unknown[] };
  const matches = payload.matches ?? [];

  console.log('[import:wc26:schedule] mode=', dryRun ? 'dry-run' : 'apply');
  console.log('[import:wc26:schedule] detected_matches=', matches.length);
  if (!dryRun) {
    console.log('[import:wc26:schedule] apply mode not yet wired to DB in this commit');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
