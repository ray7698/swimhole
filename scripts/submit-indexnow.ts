import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import {createSwimHoleStore} from '../server/storage';
import {getPrerenderPaths} from '../src/lib/site';

dotenv.config();

function findIndexNowKey(publicDir: string): {key: string; filename: string} | null {
  if (!fs.existsSync(publicDir)) return null;
  const files = fs.readdirSync(publicDir);
  for (const file of files) {
    if (/^[a-f0-9]{32}\.txt$/.test(file)) {
      const key = file.replace('.txt', '');
      return {key, filename: file};
    }
  }
  return null;
}

export async function submitToIndexNow(siteUrl: string) {
  console.log(`[IndexNow] Resolving key and paths for: ${siteUrl}`);

  const publicDir = path.resolve('public');
  const keyInfo = findIndexNowKey(publicDir);

  if (!keyInfo) {
    console.warn('[IndexNow] No IndexNow key file found in public/ matching 32-hex-character pattern.');
    return;
  }

  const urlObj = new URL(siteUrl);
  const host = urlObj.host;

  if (host.includes('localhost') || host.includes('127.0.0.1') || host.startsWith('0.0.0.0')) {
    console.log(`[IndexNow] Skipping submission for local host: ${host}`);
    return;
  }

  try {
    const holes = await createSwimHoleStore().list();
    const paths = getPrerenderPaths(holes);
    const urlList = paths.map((p) => new URL(p, siteUrl).toString());

    const keyLocation = new URL(keyInfo.filename, siteUrl).toString();

    console.log(`[IndexNow] Submitting ${urlList.length} URLs to IndexNow for host: ${host}`);
    
    const payload = {
      host,
      key: keyInfo.key,
      keyLocation,
      urlList,
    };

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[IndexNow] Successfully submitted URLs. Status: ${response.status} ${response.statusText}`);
    } else {
      const text = await response.text();
      console.error(`[IndexNow] Failed to submit URLs. Status: ${response.status} ${response.statusText}. Response: ${text}`);
    }
  } catch (error) {
    console.error('[IndexNow] Error during IndexNow submission:', error);
  }
}

// Support running directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const siteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.APP_URL || 'https://www.swimholes.com';
  void submitToIndexNow(siteUrl);
} else {
  // Fallback check for tsx/node running directly when path comparison is tricky
  const isDirect = process.argv.some(val => val.includes('submit-indexnow.ts'));
  if (isDirect) {
    const siteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.APP_URL || 'https://www.swimholes.com';
    void submitToIndexNow(siteUrl);
  }
}
