#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

function printHelp() {
  console.log(`AIDIFF installer

Usage:
  node scripts/install.js [--global] [--local] [--prefix <path>] [--dry-run]
  ./install.sh [--global] [--prefix <path>] [--dry-run]
  powershell -ExecutionPolicy Bypass -File ./install.ps1 [--global] [--prefix <path>] [--dry-run]

Options:
  --global       Install the package globally for the current machine.
  --local        Install the package into the current working directory only.
  --prefix PATH  Install into a custom prefix directory.
  --dry-run      Print the exact npm command without executing it.
  --help         Show this help text.

Examples:
  node scripts/install.js --global
  node scripts/install.js --prefix "$HOME/.local" --global
  ./install.sh --dry-run --global
`);
}

function parseArgs(argv) {
  const options = {
    global: false,
    local: false,
    prefix: undefined,
    dryRun: false,
    help: false,
    packageTarget: projectRoot,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];

    switch (current) {
      case '--global':
        options.global = true;
        break;
      case '--local':
        options.local = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--prefix':
        options.prefix = argv[i + 1];
        i += 1;
        break;
      case '--package':
        options.packageTarget = resolve(process.cwd(), argv[i + 1]);
        i += 1;
        break;
      default:
        if (current.startsWith('--')) {
          throw new Error(`Unknown option: ${current}`);
        }
        options.packageTarget = resolve(process.cwd(), current);
        break;
    }
  }

  if (options.global && options.local) {
    throw new Error('Choose either --global or --local, not both.');
  }

  if (!options.global && !options.local) {
    options.global = true;
  }

  return options;
}

function buildNpmCommand(options) {
  const args = ['install'];

  const packageTarget = existsSync(join(options.packageTarget, 'package.json'))
    ? options.packageTarget
    : options.packageTarget;

  if (options.prefix) {
    args.push('--prefix', options.prefix);
  }

  if (options.global) {
    args.push('--global');
  }

  args.push(packageTarget);

  return { command: 'npm', args };
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
      printHelp();
      return;
    }

    const { command, args } = buildNpmCommand(options);
    const commandString = [command, ...args].join(' ');

    if (options.dryRun) {
      console.log(`dry-run: ${commandString}`);
      return;
    }

    const result = spawnSync(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: false,
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }

    console.log(`Installed AIDIFF using: ${commandString}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`AIDIFF installer error: ${message}`);
    console.error('Run with --help for usage information.');
    process.exit(1);
  }
}

main();
