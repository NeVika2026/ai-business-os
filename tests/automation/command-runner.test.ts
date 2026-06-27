import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createCommandRunner } from '@/services/automation/command-runner';
import { CommandRunnerValidationError } from '@/services/automation/command-runner-errors';

describe('CommandRunner', () => {
  it('runs a successful command', () => {
    const runner = createCommandRunner({ instanceId: 'command-runner-success' });
    const result = runner.run('node', ['--version']);

    assert.equal(result.success, true);
    assert.equal(result.command, 'node');
    assert.deepEqual(result.args, ['--version']);
    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /v\d+/);
    assert.equal(result.stderr, '');
    assert.ok(result.durationMs >= 0);
    assert.equal(result.timedOut, false);
  });

  it('returns graceful failure for a missing command', () => {
    const runner = createCommandRunner({
      instanceId: 'command-runner-missing',
      env: { PATH: '' },
    });

    assert.equal(runner.exists('node'), false);
    assert.equal(runner.version('node'), null);

    const result = runner.run('node', ['--version']);

    assert.equal(result.success, false);
    assert.equal(result.exitCode, 127);
    assert.match(result.stderr, /command not found: node/);
    assert.equal(result.timedOut, false);
  });

  it('kills a process after timeout', () => {
    const runner = createCommandRunner({
      instanceId: 'command-runner-timeout',
      timeoutMs: 200,
    });

    const result = runner.run('node', ['-e', 'setInterval(() => {}, 1000)']);

    assert.equal(result.success, false);
    assert.equal(result.timedOut, true);
    assert.equal(result.exitCode, 124);
  });

  it('rejects an invalid cwd', () => {
    const runner = createCommandRunner({ instanceId: 'command-runner-invalid-cwd' });

    assert.throws(
      () => runner.run('node', ['--version'], '/path/that/does/not/exist'),
      (error: unknown) => error instanceof CommandRunnerValidationError,
    );
  });

  it('serializes runner state after a run', () => {
    const runner = createCommandRunner({ instanceId: 'command-runner-serialize' });
    runner.run('node', ['--version']);

    const snapshot = runner.serialize();

    assert.equal(snapshot.instanceId, 'command-runner-serialize');
    assert.equal(snapshot.lastCommand, 'node');
    assert.deepEqual(snapshot.lastArgs, ['--version']);
    assert.equal(snapshot.lastSuccess, true);
    assert.equal(snapshot.runCount, 1);
    assert.ok(snapshot.lastResult);
    assert.equal(snapshot.lastResult?.command, 'node');
    assert.equal(snapshot.lastResult?.success, true);

    runner.reset();
    const resetSnapshot = runner.serialize();
    assert.equal(resetSnapshot.runCount, 0);
    assert.equal(resetSnapshot.lastResult, null);
  });
});
