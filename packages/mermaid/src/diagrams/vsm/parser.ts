// cspell:ignore cycletime
import type { Vsm } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { db } from './db.js';
import type { VsmFlowItem, VsmStep, VsmQueue, VsmSummary, VsmDuration } from './types.js';

function toDuration(astDuration: { min: string; max?: string }): VsmDuration {
  return {
    min: astDuration.min,
    max: astDuration.max ?? undefined,
  };
}

const populate = (ast: Vsm) => {
  populateCommonDb(ast, db);

  if (ast.flow) {
    const flow: VsmFlowItem[] = ast.flow.items.map((item) => {
      if ('label' in item) {
        return {
          kind: 'endpoint' as const,
          data: {
            type: item.type as VsmFlowItem extends { kind: 'endpoint'; data: infer D }
              ? D extends { type: infer T }
                ? T
                : never
              : never,
            label: item.label,
          },
        };
      }
      return { kind: 'process' as const, name: item.name };
    });
    db.setFlow(flow);
  }

  if (ast.steps) {
    const steps: VsmStep[] = ast.steps.map((step) => {
      const result: VsmStep = {
        name: step.name,
        label: step.label,
      };
      for (const metric of step.metrics ?? []) {
        if (metric.type === 'cycletime') {
          result.cycletime = toDuration(metric.value);
        } else if (metric.type === 'changeover') {
          result.changeover = toDuration(metric.value);
        }
      }
      if (step.uptime) {
        result.uptime = step.uptime.value;
      }
      if (step.batch) {
        result.batch = step.batch.value;
      }
      if (step.flowType) {
        result.flowType = step.flowType as 'push' | 'pull';
      }
      return result;
    });
    db.setSteps(steps);
  }

  if (ast.queues) {
    const queues: VsmQueue[] = ast.queues.map((queue) => ({
      value: toDuration(queue.value),
    }));
    db.setQueues(queues);
  }

  if (ast.summary) {
    const summary: VsmSummary = {
      all: ast.summary.all ?? false,
      items: (ast.summary.items ?? []) as VsmSummary['items'],
    };
    db.setSummary(summary);
  }
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: Vsm = await parse('vsm', input);
    log.debug(ast);
    populate(ast);
  },
};
