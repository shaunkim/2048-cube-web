const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = global.test ?? require('node:test');

const workflowPath = resolve(__dirname, '../.github/workflows/deploy-pages.yml');
const appConfig = require('../app.json');

test('publishes the web export only when the repository is public', () => {
  assert.equal(existsSync(workflowPath), true, 'Pages workflow should exist');

  const workflow = readFileSync(workflowPath, 'utf8');

  assert.match(workflow, /^on:\n  push:\n    branches: \[main\]\n  workflow_dispatch:/m);
  assert.match(workflow, /^permissions:\n  contents: read\n  pages: write\n  id-token: write/m);
  assert.match(workflow, /^  build:\n    if: github\.event\.repository\.private == false/m);
  assert.match(workflow, /^  deploy:\n    if: github\.event\.repository\.private == false\n    needs: build/m);
  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /uses: actions\/configure-pages@v5\n        with:\n          enablement: true/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /node-version: 20/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run build:web/);
  assert.match(workflow, /path: dist/);
  assert.match(workflow, /environment:\n      name: github-pages/m);
  assert.equal(appConfig.expo.web.favicon, appConfig.expo.icon);
});
