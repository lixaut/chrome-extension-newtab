#!/usr/bin/env node
/**
 * 构建后处理：
 *  1. 把 package.json 的版本号写入产物 manifest（版本唯一来源）
 *  2. 根据 .env 配置补全 host_permissions
 *  3. 清理其它版本号的旧产物目录
 *
 * - 服务器地址来自 .env，不写死在代码里
 * - 未配置时移除 host_permissions，扩展仅使用内置种子数据
 * - 配置非法（非 http/https 或非法 URL）时直接失败，避免产出静默失效的包
 * - 支持 http，但会给出明文传输告警
 *
 * 用法: 构建后自动执行（见 package.json build-only）
 */
import { existsSync, readFileSync } from 'node:fs';
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** 版本唯一来源：package.json（由 npm run bump 更新） */
const VERSION = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const OUT_DIR_NAME = `NewTaber_v${VERSION}`;
const OUT_DIR = path.join(root, OUT_DIR_NAME);
const MANIFEST_FILE = path.join(OUT_DIR, 'manifest.json');

/** 极简 .env 解析，覆盖 .env 与 .env.local（后者优先），与 Vite 加载顺序一致 */
const loadEnv = () => {
  const values = {};
  for (const name of ['.env', '.env.local']) {
    const file = path.join(root, name);
    if (!existsSync(file)) continue;
    const text = readFileSyncSafe(file);
    for (const line of text.split(/\r?\n/)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      // 与 Vite 一致：未加引号时 # 起为行内注释
      const value = match[2].replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '');
      values[match[1]] = value;
    }
  }
  return values;
};

const readFileSyncSafe = (file) => {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
};

const writeManifest = async (manifest) => {
  manifest.version = VERSION;
  await writeFile(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
};

/** 只删除形如 NewTaber_v1.2.3 的旧产物目录，其它一律跳过 */
const cleanOldBuilds = async () => {
  for (const name of await readdir(root)) {
    if (!/^NewTaber_v\d+\.\d+\.\d+$/.test(name)) continue;
    if (name === OUT_DIR_NAME) continue;
    await rm(path.join(root, name), { recursive: true, force: true });
    console.log(`✓ 已清理旧版本产物: ${name}/`);
  }
};

const main = async () => {
  if (!existsSync(MANIFEST_FILE)) {
    throw new Error(`找不到 manifest: ${path.relative(root, MANIFEST_FILE)}，请先执行 vite build`);
  }

  // 与 Vite 加载顺序一致：进程环境变量优先于 .env 文件
  const api = (process.env.VITE_HOLIDAY_API ?? loadEnv().VITE_HOLIDAY_API ?? '').trim();
  const manifest = JSON.parse(await readFile(MANIFEST_FILE, 'utf8'));

  if (!api) {
    delete manifest.host_permissions;
    await writeManifest(manifest);
    console.log('✓ manifest: 未配置 VITE_HOLIDAY_API，已移除 host_permissions（仅使用内置种子）');
  } else {
    let origin;
    try {
      origin = new URL(api).origin;
    } catch {
      throw new Error(`VITE_HOLIDAY_API 不是合法 URL: ${api}`);
    }
    if (!/^https?:\/\//.test(origin)) {
      throw new Error(`VITE_HOLIDAY_API 仅支持 http/https: ${api}`);
    }

    manifest.host_permissions = [`${origin}/*`];
    await writeManifest(manifest);
    console.log(`✓ manifest: version = ${VERSION}, host_permissions = ${origin}/*`);
    if (origin.startsWith('http://')) {
      console.warn(`⚠ 使用 HTTP：明文传输，数据可被中间人篡改且扩展无签名校验，建议改用 HTTPS`);
    }
  }

  await cleanOldBuilds();
};

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
