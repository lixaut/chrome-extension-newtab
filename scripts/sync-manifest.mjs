#!/usr/bin/env node
/**
 * npm version 生命周期钩子：把 package.json 的新版本号同步进 public/manifest.json 模板
 *
 * 触发方式: npm run bump -- patch|minor|major
 * （package.json / package-lock.json 由 npm 自己更新，本脚本只负责 manifest 模板）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkgFile = path.join(root, 'package.json');
const manifestFile = path.join(root, 'public', 'manifest.json');

const version = JSON.parse(readFileSync(pkgFile, 'utf8')).version;
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));

if (manifest.version === version) {
  console.log(`✓ public/manifest.json 版本已是 ${version}`);
} else {
  const old = manifest.version;
  manifest.version = version;
  writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`✓ public/manifest.json version: ${old} → ${version}`);
}
