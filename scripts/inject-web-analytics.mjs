import { readFile, writeFile } from 'node:fs/promises';

const source = new URL('../web/index.html', import.meta.url);
const output = new URL('../dist/index.html', import.meta.url);
const html = await readFile(source, 'utf8');

if (!html.includes('GTM-5MJCVRSG')) {
  throw new Error('The web HTML template is missing the configured GTM container.');
}

await writeFile(output, html);
