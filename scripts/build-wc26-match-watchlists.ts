import 'dotenv/config';
const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
console.log('[build:wc26:watchlists] mode=', dryRun ? 'dry-run' : 'apply');
console.log('[build:wc26:watchlists] strategy=team+match+tournament_context');
