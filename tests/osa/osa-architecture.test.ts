import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';

const REPO_ROOT = join(import.meta.dirname, '..', '..');

const OSA_UTILS_DIR = join(REPO_ROOT, 'utils', 'osa');
const OSA_COMPONENTS_DIR = join(REPO_ROOT, 'components', 'osa');

const FORBIDDEN_RUNTIME_IMPORTS = [
  '@/services/runtime/runtime-bridge',
  '@/services/runtime/runtime-api',
  '@/services/runtime/memory/',
  '@/services/runtime/knowledge/',
  '@/services/automation/',
];

function collectSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function readImports(source: string): string[] {
  const imports: string[] = [];
  const importPattern = /from ['"]([^'"]+)['"]/g;

  for (const match of source.matchAll(importPattern)) {
    imports.push(match[1]!);
  }

  return imports;
}

describe('OSA architecture validation', () => {
  it('keeps utils/osa free of RuntimeBridge and automation internals', () => {
    const violations: string[] = [];

    for (const filePath of collectSourceFiles(OSA_UTILS_DIR)) {
      const source = readFileSync(filePath, 'utf8');
      const imports = readImports(source);
      const relativePath = relative(REPO_ROOT, filePath);

      for (const importPath of imports) {
        for (const forbidden of FORBIDDEN_RUNTIME_IMPORTS) {
          if (importPath.startsWith(forbidden)) {
            violations.push(`${relativePath} -> ${importPath}`);
          }
        }
      }
    }

    assert.deepEqual(violations, []);
  });

  it('avoids circular imports between execution-progress and execution-controls', () => {
    const progressSource = readFileSync(join(OSA_UTILS_DIR, 'execution-progress.ts'), 'utf8');
    const controlsSource = readFileSync(join(OSA_UTILS_DIR, 'execution-controls.ts'), 'utf8');

    assert.match(progressSource, /mapSessionToControlState/);
    assert.doesNotMatch(controlsSource, /from '@\/utils\/osa\/execution-progress'/);
  });

  it('documents canonical execution model ownership', () => {
    const modelsSource = readFileSync(join(OSA_UTILS_DIR, 'execution-models.ts'), 'utf8');

    assert.match(modelsSource, /ExecutionPlan/);
    assert.match(modelsSource, /ExecutionGraph/);
    assert.match(modelsSource, /ExecutionSession/);
  });

  it('uses shared OSA constants for history limits and intent-first workspace flow', () => {
    const constantsSource = readFileSync(join(OSA_UTILS_DIR, 'osa-constants.ts'), 'utf8');
    const onboardingSource = readFileSync(
      join(OSA_COMPONENTS_DIR, 'osa-onboarding-flow.tsx'),
      'utf8',
    );
    const runsSource = readFileSync(join(OSA_UTILS_DIR, 'osa-runs.ts'), 'utf8');

    assert.match(constantsSource, /OSA_PROGRESS_POLL_INTERVAL_MS/);
    assert.match(onboardingSource, /buildIntentConfirmation/);
    assert.match(onboardingSource, /\/results\//);
    assert.match(runsSource, /from '@\/utils\/osa\/osa-constants'/);
  });
});
