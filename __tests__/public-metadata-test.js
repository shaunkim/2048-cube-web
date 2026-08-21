const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const yaml = require('js-yaml');
const test = global.test ?? require('node:test');

const root = resolve(__dirname, '..');
const read = (relativePath) => {
  const path = resolve(root, relativePath);
  assert.equal(existsSync(path), true, `${relativePath} must exist`);
  return readFileSync(path, 'utf8');
};

test('publishes complete project, licensing, and attribution metadata', () => {
  const readme = read('README.md');
  const license = read('LICENSE');
  const notices = read('THIRD_PARTY_NOTICES.md');

  for (const heading of [
    '## 2048³',
    '## Play Online',
    '## Get the Game',
    '## How It Works',
    '## Controls',
    '## Run Locally',
    '## Build',
    '## Feedback / Support',
    '## Open Source / License',
    '## Acknowledgments',
    '## Why I Built This',
  ]) assert.match(readme, new RegExp(heading.replace(/[³/]/g, '\\$&')));

  for (const value of [
    'https://shaunkim.github.io/2048-cube-web/',
    'https://github.com/shaunkim/2048-cube-web',
    'App Store — Coming soon',
    'Google Play — Coming soon',
    'https://github.com/shaunkim/2048-cube-web/issues',
    'npm ci',
    'npm run web',
    'npm run build:web',
    'Q', 'W', 'E', 'A', 'S', 'D',
    'Up-left', 'Up', 'Up-right', 'Down-left', 'Down', 'Down-right',
    '×1', '×2', '×4', '×8',
    'Gabriele Cirulli',
    'not affiliated with or endorsed by',
  ]) assert.ok(readme.includes(value), `README must include ${value}`);

  assert.match(license, /^MIT License\n\nCopyright \(c\) 2026 Shaun Kim/m);
  assert.match(notices, /Clear Sans[\s\S]*Apache License, Version 2\.0/);
  assert.match(notices, /2048[\s\S]*Copyright \(c\) 2014 Gabriele Cirulli/);
  assert.match(notices, /palette adapted from Gabriele Cirulli's 2048/);
  assert.match(notices, /independent cube topology and game engine/);
  assert.match(notices, /Permission is hereby granted, free of charge/);
  assert.match(notices, /THE SOFTWARE IS PROVIDED "AS IS"/);
});

test('offers structured bug and feature reports while disabling blank issues', () => {
  const config = yaml.load(read('.github/ISSUE_TEMPLATE/config.yml'));
  const bug = yaml.load(read('.github/ISSUE_TEMPLATE/bug_report.yml'));
  const feature = yaml.load(read('.github/ISSUE_TEMPLATE/feature_request.yml'));

  assert.equal(config.blank_issues_enabled, false);
  assert.equal(bug.name, 'Bug report');
  assert.equal(feature.name, 'Feature request');
  assert.ok(bug.description.length > 0);
  assert.ok(feature.description.length > 0);
  assert.ok(bug.body.some((field) => field.id === 'browser'));
  assert.ok(bug.body.some((field) => field.id === 'steps'));
  assert.ok(feature.body.some((field) => field.id === 'problem'));
  assert.ok(feature.body.some((field) => field.id === 'proposal'));
});

test('keeps the required public metadata files present', () => {
  for (const relativePath of [
    'README.md',
    'LICENSE',
    'SECURITY.md',
    'THIRD_PARTY_NOTICES.md',
    '.github/ISSUE_TEMPLATE/bug_report.yml',
    '.github/ISSUE_TEMPLATE/feature_request.yml',
    '.github/ISSUE_TEMPLATE/config.yml',
  ]) assert.equal(existsSync(resolve(root, relativePath)), true, `${relativePath} must exist`);
});

test('publishes the approved build-tool security waiver and reporting policy', () => {
  const security = read('SECURITY.md');
  const packageConfig = JSON.parse(read('package.json'));

  assert.equal(packageConfig.license, 'MIT');

  for (const value of [
    'GHSA-w3rx-r6r6-pgpr',
    'GHSA-5p2g-fcmc-qvqq',
    'GHSA-w5hq-g745-h8pq',
    'expo@57.0.15 → @expo/metro@56.0.0 → metro@0.84.4 → image-size@1.2.1',
    'expo@57.0.15 → @expo/config-plugins@57.0.8 → xcode@3.0.1 → uuid@7.0.3',
    'browser runtime',
    'build inputs',
    'main',
    'workflow_dispatch',
    'unsupported dependency overrides',
    'expo',
    '@expo/metro',
    '@expo/config-plugins',
    'https://github.com/shaunkim/2048-cube-web/issues',
    'Do not include personal data',
  ]) assert.ok(security.includes(value), `SECURITY.md must include ${value}`);
});
