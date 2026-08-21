const { existsSync, readdirSync } = require('node:fs');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const test = global.test ?? require('node:test');

const root = resolve(__dirname, '..');
const packageConfig = require('../package.json');
const appConfig = require('../app.json');
const GENERATED_TOP_LEVEL_DIRECTORIES = new Set(['.expo', 'coverage', 'dist', 'node_modules', 'web-build']);
const PUBLIC_TOP_LEVEL_ENTRIES = [
  '.github',
  '.gitignore',
  'App.tsx',
  'LICENSE',
  'README.md',
  'SECURITY.md',
  'THIRD_PARTY_NOTICES.md',
  '__tests__',
  'app.json',
  'assets',
  'eslint.config.js',
  'index.ts',
  'jest.config.js',
  'jest.setup.js',
  'package-lock.json',
  'package.json',
  'src',
  'tsconfig.json',
];

function projectPath(relativePath) {
  return resolve(root, relativePath);
}

test('keeps the public tree limited to its documented web inventory', () => {
  const entries = readdirSync(root, { withFileTypes: true })
    .filter((entry) => !(entry.isDirectory() && GENERATED_TOP_LEVEL_DIRECTORIES.has(entry.name)))
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(Array.from(entries), Array.from(PUBLIC_TOP_LEVEL_ENTRIES));
});

test('ships no native implementation material', () => {
  const removedPaths = [
    'ios',
    'android',
    'src/storage/platformStore.native.ts',
    '__tests__/app-native-layout-test.tsx',
    '__tests__/ios-build-settings-test.js',
    '__tests__/native-module-dependencies-test.js',
    '__tests__/app-icon-assets-test.js',
    'scripts/generate-app-icon.mjs',
  ];

  assert.deepEqual(removedPaths.filter((path) => existsSync(projectPath(path))), []);
});

test('exposes only the web build surface', () => {
  assert.equal(packageConfig.name, '2048-cube-web');
  assert.equal(packageConfig.license, 'MIT');
  assert.equal(packageConfig.homepage, 'https://github.com/shaunkim/2048-cube-web');
  assert.deepEqual(packageConfig.repository, {
    type: 'git',
    url: 'https://github.com/shaunkim/2048-cube-web.git',
  });
  assert.deepEqual(packageConfig.bugs, {
    url: 'https://github.com/shaunkim/2048-cube-web/issues',
  });
  assert.deepEqual(Object.keys(packageConfig.scripts).sort(), [
    'build:web',
    'lint',
    'test',
    'test:watch',
    'typecheck',
    'web',
  ]);
  assert.equal(packageConfig.dependencies['expo-sharing'], undefined);
  assert.equal(packageConfig.dependencies['react-native-view-shot'], undefined);
  assert.equal(packageConfig.dependencies['@react-native-async-storage/async-storage'], undefined);
  assert.equal(packageConfig.dependencies['expo-dev-client'], undefined);
  assert.equal(appConfig.expo.slug, '2048-cube-web');
  assert.equal(appConfig.expo.ios, undefined);
  assert.equal(appConfig.expo.android, undefined);
  assert.deepEqual(appConfig.expo.web, {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  });
  assert.deepEqual(appConfig.expo.experiments, { baseUrl: '/2048-cube-web' });
  assert.deepEqual(appConfig.expo.plugins, ['expo-font', 'expo-asset']);
});

test('keeps the root free of native build artifacts', () => {
  const nativeArtifacts = [
    'Podfile',
    'Podfile.lock',
    'Gemfile',
    'gradlew',
    'build.gradle',
    'settings.gradle',
  ];

  assert.equal(readdirSync(root).filter((entry) => nativeArtifacts.includes(entry)).length, 0);
});
