// Copies the site's images from R2 onto our own hosting at deploy time. Some
// home networks cannot reach r2.dev, and visitors behind them see the site
// without a single picture. Files land in public/uploads, and the manifest
// lists what really arrived: storage.ts swaps only those URLs, anything else
// keeps loading from R2. Never blocks the deploy.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const R2_PREFIX = 'https://pub-9348f600a2374d408b97c01512a4a260.r2.dev/superdudes/uploads/';
const OUT_DIR = join('public', 'uploads');
const CONCURRENCY = 6;

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = process.env;
if (!url || !key) {
  console.error('mirror-assets: Supabase env is missing, skipping');
  process.exit(1);
}

const query = new URLSearchParams({
  select: 'value',
  key: 'like.sd_asset_*',
  value: `like.${R2_PREFIX}*`,
});
const res = await fetch(`${url}/rest/v1/assets?${query}`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
if (!res.ok) throw new Error(`assets query failed: ${res.status}`);

const names = [...new Set((await res.json()).map((row) => row.value.slice(R2_PREFIX.length)))];
await mkdir(OUT_DIR, { recursive: true });

const mirrored = [];
const queue = [...names];

async function worker() {
  for (let name = queue.shift(); name; name = queue.shift()) {
    try {
      const file = await fetch(R2_PREFIX + name);
      if (!file.ok) throw new Error(`HTTP ${file.status}`);
      await writeFile(join(OUT_DIR, name), Buffer.from(await file.arrayBuffer()));
      mirrored.push(name);
    } catch (error) {
      console.error(`mirror-assets: ${name}: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await writeFile(join(OUT_DIR, 'manifest.json'), JSON.stringify(mirrored));
console.log(`mirror-assets: ${mirrored.length}/${names.length} mirrored`);
