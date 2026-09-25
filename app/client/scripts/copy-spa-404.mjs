// GitHub Pages has no rewrite. /draft hydrates from 404.html copied from the Start shell.
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const clientRoot = fileURLToPath(new URL('..', import.meta.url));
const candidates = ['dist/client/_shell.html', 'dist/_shell.html', '.output/public/_shell.html'];

for (const relative of candidates) {
    const shell = join(clientRoot, relative);
    if (!existsSync(shell)) continue;
    copyFileSync(shell, join(dirname(shell), '404.html'));
    console.log(`Copied ${relative} to 404.html`);
    process.exit(0);
}

throw new Error(`Could not find _shell.html under ${clientRoot} (${candidates.join(', ')})`);
