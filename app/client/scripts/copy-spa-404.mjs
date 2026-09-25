// GitHub Pages has no rewrite. /draft hydrates from 404.html next to the prerendered pages.
// Only the publish dir counts. A hit in dist/ or .output/ would exit 0 and Pages would still 404.

import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const clientRoot = fileURLToPath(new URL('..', import.meta.url));
const shell = join(clientRoot, 'dist/client/_shell.html');
const dest = join(clientRoot, 'dist/client/404.html');

if (!existsSync(shell)) {
    throw new Error(`Could not find dist/client/_shell.html under ${clientRoot}. Publish dir is dist/client.`);
}

copyFileSync(shell, dest);
console.log('Copied dist/client/_shell.html to dist/client/404.html');
