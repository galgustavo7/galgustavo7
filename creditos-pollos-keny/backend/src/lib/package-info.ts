import fs from 'node:fs';
import path from 'node:path';

let cached: { name: string; version: string } | null = null;

export const packageInfo = {
  get name(): string {
    return load().name;
  },
  get version(): string {
    return load().version;
  },
};

function load(): { name: string; version: string } {
  if (cached) return cached;
  try {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const raw = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { name: string; version: string };
    cached = { name: raw.name, version: raw.version };
  } catch {
    cached = { name: 'creditos-pollos-keny-backend', version: '1.0.0' };
  }
  return cached;
}
