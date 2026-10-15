import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import type { AppConfig } from './types.js';

export const appConfigSchema = z.object({
  promptRetention: z.enum(['none', 'summary', 'full']).default('summary'),
  localOnly: z.boolean().default(true),
  redactSecrets: z.boolean().default(true),
  defaultRepoName: z.string().optional(),
});

export function createAppConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    promptRetention: 'summary',
    localOnly: true,
    redactSecrets: true,
    ...overrides,
  };
}

export function writeAppConfig(filePath: string, config: AppConfig): void {
  const resolvedPath = resolve(filePath);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, JSON.stringify({ ...config }, null, 2) + '\n', 'utf8');
}

export function readAppConfig(filePath: string): AppConfig {
  const resolvedPath = resolve(filePath);
  const raw = readFileSync(resolvedPath, 'utf8');
  return appConfigSchema.parse(JSON.parse(raw));
}

export function ensureConfigFile(repoRoot: string): string {
  const configDir = resolve(repoRoot, '.ai-history');
  const configPath = resolve(configDir, 'config.json');
  mkdirSync(configDir, { recursive: true });
  return configPath;
}
