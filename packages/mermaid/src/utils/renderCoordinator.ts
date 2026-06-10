import { isEqual } from 'es-toolkit';

/**
 * Describes what a render/parse job needs from the shared environment, so the
 * coordinator can decide which jobs may safely run concurrently.
 */
export interface CoordinatorSlot {
  /**
   * The fully resolved configuration state the job will run under.
   *
   * Jobs whose keys are deeply equal may run concurrently: the global
   * configuration they (re)apply is identical, so it does not matter which of
   * them applied it last. Jobs with differing keys are serialized.
   *
   * Compared with deep equality; functions and other non-plain values are
   * compared by reference, so unequal-by-reference exotic values
   * conservatively serialize.
   */
  configKey: unknown;
  /**
   * Named mutexes for module-scoped state the job touches (e.g. layout
   * scratch state, legacy singleton diagram DBs). Two jobs that share a
   * resource name never run concurrently.
   */
  resources?: Iterable<string>;
}

/**
 * Releases a previously acquired slot. Calling it more than once is a no-op.
 */
export type ReleaseCoordinatorSlot = () => void;

interface WaitingJob {
  configKey: unknown;
  resources: string[];
  admit: () => void;
}

/**
 * Admission control for concurrent render/parse jobs.
 *
 * This replaces the former global execution queue. Instead of serializing
 * every call, jobs are only serialized when they actually conflict — either
 * because they require different global configurations, or because they touch
 * the same named shared resource. Compatible jobs run concurrently.
 *
 * Jobs are admitted strictly in arrival order (no barging): a job that cannot
 * run yet blocks every later job, so a steady stream of compatible jobs can
 * never starve an incompatible one. Whenever a job finishes, the head of the
 * queue (and every directly following compatible job) is admitted.
 */
export class RenderCoordinator {
  private activeCount = 0;
  private activeConfigKey: unknown = undefined;
  private readonly lockedResources = new Set<string>();
  private readonly waiting: WaitingJob[] = [];

  /**
   * Waits until the job described by `slot` may safely run, then marks it as
   * running and returns a function that releases the slot again.
   *
   * Always release in a `finally` block so failed jobs cannot block the queue.
   */
  public async acquire(slot: CoordinatorSlot): Promise<ReleaseCoordinatorSlot> {
    const resources = [...new Set(slot.resources ?? [])];
    if (this.waiting.length === 0 && this.canAdmit(slot.configKey, resources)) {
      this.admit(slot.configKey, resources);
    } else {
      await new Promise<void>((resolve) => {
        this.waiting.push({ configKey: slot.configKey, resources, admit: resolve });
      });
      // `release()` has already admitted this job before resolving the promise.
    }

    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      this.release(resources);
    };
  }

  private canAdmit(configKey: unknown, resources: string[]): boolean {
    if (this.activeCount > 0 && !isEqual(this.activeConfigKey, configKey)) {
      return false;
    }
    return resources.every((resource) => !this.lockedResources.has(resource));
  }

  private admit(configKey: unknown, resources: string[]): void {
    this.activeConfigKey = configKey;
    this.activeCount++;
    for (const resource of resources) {
      this.lockedResources.add(resource);
    }
  }

  private release(resources: string[]): void {
    this.activeCount--;
    for (const resource of resources) {
      this.lockedResources.delete(resource);
    }
    if (this.activeCount === 0) {
      this.activeConfigKey = undefined;
    }
    // Admit the head of the queue and any directly following compatible jobs.
    while (this.waiting.length > 0) {
      const head = this.waiting[0];
      if (!this.canAdmit(head.configKey, head.resources)) {
        return;
      }
      this.waiting.shift();
      this.admit(head.configKey, head.resources);
      head.admit();
    }
  }
}
