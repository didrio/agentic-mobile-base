#!/usr/bin/env node
/**
 * PostToolUse hook (Edit|Write): formats the file Claude just changed with the project's Prettier,
 * so agent edits always match the house style and never fail `npm run format:check`.
 * Never blocks: any problem exits 0 silently.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const FORMATTABLE = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
]);

let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let file;
try {
  const payload = JSON.parse(raw);
  file = payload.tool_response?.filePath ?? payload.tool_input?.file_path;
} catch {
  process.exit(0);
}

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const prettier = join(root, 'node_modules/.bin/prettier');
if (
  !file ||
  !existsSync(file) ||
  relative(root, file).startsWith('..') ||
  !FORMATTABLE.has(extname(file)) ||
  !existsSync(prettier)
) {
  process.exit(0);
}

try {
  execFileSync(prettier, ['--write', '--log-level', 'silent', file], {
    cwd: root,
    stdio: 'ignore',
  });
} catch {
  // Unparsable mid-edit file or ignored path: leave it for lint/typecheck to report.
}
