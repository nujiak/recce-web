import { createHash } from 'crypto';
import fs from 'fs';

async function checkMapStyle() {
  const localPath = 'public/map-styles/liberty.json';
  const remoteUrl = 'https://tiles.openfreemap.org/styles/liberty';

  const localContent = fs.readFileSync(localPath, 'utf-8');
  const localHash = createHash('sha256').update(localContent).digest('hex');

  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      console.warn(`⚠️  Could not fetch remote map style: ${response.status}`);
      process.exit(0);
    }
    const remoteContent = await response.text();
    const remoteHash = createHash('sha256').update(remoteContent).digest('hex');

    if (localHash !== remoteHash) {
      console.warn('⚠️  Remote OpenFreeMap Liberty style has drifted from local snapshot.');
      console.warn(`   Update: curl -sL -o ${localPath} '${remoteUrl}'`);
      process.exit(1);
    }

    console.log('✓ Local map style matches remote snapshot.');
    process.exit(0);
  } catch (err) {
    console.warn(`⚠️  Failed to check remote map style: ${err.message}`);
    process.exit(0);
  }
}

checkMapStyle();
