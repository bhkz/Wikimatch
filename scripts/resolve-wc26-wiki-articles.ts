import 'dotenv/config';
const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
console.log('[resolve:wc26:articles] mode=', dryRun ? 'dry-run' : 'apply');
console.log('[resolve:wc26:articles] languages=', process.env.WC26_INITIAL_LANGUAGE_CODES ?? 'en,fr,es,pt,de,ar,ja,ko');
