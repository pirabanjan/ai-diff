import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

describe('installer script', () => {
  it('prints usage and supports a dry-run install flow', () => {
    const root = join(process.cwd(), 'scripts', 'install.js');

    const help = execFileSync('node', [root, '--help'], { encoding: 'utf8' });
    expect(help).toContain('Usage:');
    expect(help).toContain('install');

    const dryRun = execFileSync('node', [root, '--dry-run', '--global'], { encoding: 'utf8' });
    expect(dryRun).toContain('dry-run');
    expect(dryRun).toContain('npm install --global');
  });
});
