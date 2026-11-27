import { readFile, writeFile } from 'node:fs/promises';

const source = new URL('../web/index.html', import.meta.url);
const output = new URL('../dist/index.html', import.meta.url);
const template = await readFile(source, 'utf8');
const html = await readFile(output, 'utf8');
const gestureStyles = template.match(/<style id="game-gestures">[\s\S]*?<\/style>/)?.[0];
const bootstrap = template.match(/<script>[\s\S]*?<\/script>/)?.[0];
const fallback = template.match(/<noscript>[\s\S]*?<\/noscript>/)?.[0];

if (!bootstrap?.includes('GTM-5MJCVRSG') || !fallback?.includes('GTM-5MJCVRSG')) {
  throw new Error('The web template is missing the configured GTM snippets.');
}
if (!gestureStyles) {
  throw new Error('The web template is missing the game gesture styles.');
}

if (!html.includes('</head>') || !html.includes('<body>')) {
  throw new Error('Cannot insert GTM into the exported HTML.');
}

// Preserve Expo's generated bundle and favicon URLs.
await writeFile(
  output,
  html
    .replace('</head>', () => `  ${gestureStyles}\n    ${bootstrap}\n</head>`)
    .replace('<body>', () => `<body>\n    ${fallback}`),
);
