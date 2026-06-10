import { describe, expect, it } from 'vitest';
import { RenderCoordinator } from './renderCoordinator.js';

/** Lets all currently queued microtasks (including chained ones) run. */
const flushMicrotasks = async () => {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
};

describe('RenderCoordinator', () => {
  it('admits jobs with deeply equal config keys concurrently', async () => {
    const coordinator = new RenderCoordinator();
    const releaseA = await coordinator.acquire({ configKey: { theme: 'default' } });
    let bAdmitted = false;
    const acquireB = coordinator.acquire({ configKey: { theme: 'default' } }).then((release) => {
      bAdmitted = true;
      return release;
    });
    await flushMicrotasks();
    expect(bAdmitted).toBe(true);

    releaseA();
    (await acquireB)();
  });

  it('serializes jobs with different config keys', async () => {
    const coordinator = new RenderCoordinator();
    const releaseA = await coordinator.acquire({ configKey: { theme: 'default' } });

    let bAdmitted = false;
    const acquireB = coordinator.acquire({ configKey: { theme: 'forest' } }).then((release) => {
      bAdmitted = true;
      return release;
    });
    await flushMicrotasks();
    expect(bAdmitted).toBe(false);

    releaseA();
    await flushMicrotasks();
    expect(bAdmitted).toBe(true);
    (await acquireB)();
  });

  it('compares config keys with reference equality for functions', async () => {
    const coordinator = new RenderCoordinator();
    const releaseA = await coordinator.acquire({ configKey: { formatter: () => 1 } });

    let bAdmitted = false;
    const acquireB = coordinator.acquire({ configKey: { formatter: () => 1 } }).then((release) => {
      bAdmitted = true;
      return release;
    });
    await flushMicrotasks();
    // Different function instances must serialize, even if they look alike.
    expect(bAdmitted).toBe(false);

    releaseA();
    await flushMicrotasks();
    expect(bAdmitted).toBe(true);
    (await acquireB)();
  });

  it('serializes jobs sharing a resource even when their configs match', async () => {
    const coordinator = new RenderCoordinator();
    const key = { theme: 'default' };
    const releaseA = await coordinator.acquire({ configKey: key, resources: ['layout'] });

    let bAdmitted = false;
    let cAdmitted = false;
    const acquireB = coordinator
      .acquire({ configKey: key, resources: ['layout'] })
      .then((release) => {
        bAdmitted = true;
        return release;
      });
    const acquireC = coordinator
      .acquire({ configKey: key, resources: ['other'] })
      .then((release) => {
        cAdmitted = true;
        return release;
      });
    await flushMicrotasks();
    // B conflicts on the resource. C does not, but B arrived first and jobs
    // are admitted strictly in order, so C waits behind B.
    expect(bAdmitted).toBe(false);
    expect(cAdmitted).toBe(false);

    releaseA();
    await flushMicrotasks();
    // B is admitted, and C right after it (compatible with B).
    expect(bAdmitted).toBe(true);
    expect(cAdmitted).toBe(true);

    (await acquireB)();
    (await acquireC)();
  });

  it('admits the whole compatible batch when a blocking job finishes', async () => {
    const coordinator = new RenderCoordinator();
    const releaseA = await coordinator.acquire({ configKey: 'A' });

    const admitted: string[] = [];
    const waiters = [
      coordinator.acquire({ configKey: 'B' }).then((release) => {
        admitted.push('b1');
        return release;
      }),
      coordinator.acquire({ configKey: 'B' }).then((release) => {
        admitted.push('b2');
        return release;
      }),
      coordinator.acquire({ configKey: 'C' }).then((release) => {
        admitted.push('c1');
        return release;
      }),
    ];
    await flushMicrotasks();
    expect(admitted).toEqual([]);

    releaseA();
    await flushMicrotasks();
    // Both B jobs run together; C stays queued behind them.
    expect(admitted).toEqual(['b1', 'b2']);

    (await waiters[0])();
    await flushMicrotasks();
    expect(admitted).toEqual(['b1', 'b2']);

    (await waiters[1])();
    await flushMicrotasks();
    expect(admitted).toEqual(['b1', 'b2', 'c1']);
    (await waiters[2])();
  });

  it('does not let later compatible jobs barge past a waiting job', async () => {
    const coordinator = new RenderCoordinator();
    const releaseA = await coordinator.acquire({ configKey: 'A' });

    const admitted: string[] = [];
    const waitingB = coordinator.acquire({ configKey: 'B' }).then((release) => {
      admitted.push('b');
      return release;
    });
    // Same key as the running job, but it must still wait its turn behind B.
    const waitingA2 = coordinator.acquire({ configKey: 'A' }).then((release) => {
      admitted.push('a2');
      return release;
    });
    await flushMicrotasks();
    expect(admitted).toEqual([]);

    releaseA();
    await flushMicrotasks();
    expect(admitted).toEqual(['b']);

    (await waitingB)();
    await flushMicrotasks();
    expect(admitted).toEqual(['b', 'a2']);
    (await waitingA2)();
  });

  it('treats release as idempotent', async () => {
    const coordinator = new RenderCoordinator();
    const releaseA = await coordinator.acquire({ configKey: 'A', resources: ['r'] });
    releaseA();
    releaseA();

    // The slot is fully free again: an incompatible job may run.
    const releaseB = await coordinator.acquire({ configKey: 'B', resources: ['r'] });
    releaseB();
  });

  it('keeps serving the queue when a job fails and releases in finally', async () => {
    const coordinator = new RenderCoordinator();

    const run = async (configKey: string, work: () => Promise<void>) => {
      const release = await coordinator.acquire({ configKey });
      try {
        await work();
      } finally {
        release();
      }
    };

    await expect(run('A', () => Promise.reject(new Error('render failed')))).rejects.toThrow(
      'render failed'
    );

    // The failed job must not block later jobs.
    await run('B', () => Promise.resolve());
  });

  it('handles interleaved acquire/release stress without losing jobs', async () => {
    const coordinator = new RenderCoordinator();
    const keys = ['A', 'B', 'C'];
    let running = 0;
    const seen: { key: string; concurrentWith: string[] }[] = [];
    const active = new Map<string, number>();

    const job = async (i: number) => {
      const key = keys[i % keys.length];
      const release = await coordinator.acquire({ configKey: key, resources: [] });
      try {
        running++;
        active.set(key, (active.get(key) ?? 0) + 1);
        // Only jobs with the same key may be active at the same time.
        const concurrentKeys = [...active.entries()]
          .filter(([, count]) => count > 0)
          .map(([k]) => k);
        seen.push({ key, concurrentWith: concurrentKeys });
        await new Promise((resolve) => setTimeout(resolve, i % 3));
      } finally {
        active.set(key, (active.get(key) ?? 1) - 1);
        running--;
        release();
      }
    };

    await Promise.all(Array.from({ length: 30 }, (_, i) => job(i)));
    expect(running).toBe(0);
    for (const { key, concurrentWith } of seen) {
      expect(concurrentWith).toEqual([key]);
    }
  });
});
