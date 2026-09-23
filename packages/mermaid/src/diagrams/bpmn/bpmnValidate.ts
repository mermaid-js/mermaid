import type { BpmnFlow, BpmnGateway, BpmnModel, BpmnNode } from './bpmnTypes.js';

/**
 * Semantic validation for the BPMN model — the "AI-first" layer. Every message
 * names the offending id, states the rule, and gives a concrete fix, so an LLM (or
 * a human) can self-correct in a single pass. All violations are collected and
 * reported together.
 */

const isFlowNode = (node: BpmnNode): boolean => node.kind !== 'data';

const levenshtein = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[n];
};

const didYouMean = (id: string, known: string[]): string => {
  let best: string | undefined;
  let bestDist = Infinity;
  for (const candidate of known) {
    const dist = levenshtein(id.toLowerCase(), candidate.toLowerCase());
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best !== undefined && bestDist <= 2 ? ` — did you mean '${best}'?` : '';
};

const poolLabelOf = (model: BpmnModel, poolId?: string): string =>
  model.pools.find((pool) => pool.id === poolId)?.label ?? '';

export function validateBpmn(model: BpmnModel): string[] {
  const errors: string[] = [];
  const nodeById = new Map<string, BpmnNode>();
  const seenIds = new Map<string, number>();

  // Rule 9 (duplicate ids) — also builds the id index used everywhere below.
  for (const node of model.nodes) {
    if (seenIds.has(node.id)) {
      errors.push(
        `bpmn: duplicate id '${node.id}' (first declared on line ${seenIds.get(node.id)}). Ids must be unique. Rename one, e.g. '${node.id}b'.`
      );
      continue;
    }
    seenIds.set(node.id, node.line);
    nodeById.set(node.id, node);
  }

  const knownIds = [...nodeById.keys()];

  // Rule 9 (unknown references)
  const validFlows: BpmnFlow[] = [];
  for (const flow of model.flows) {
    const src = nodeById.get(flow.sourceId);
    const dst = nodeById.get(flow.targetId);
    if (!src) {
      errors.push(
        `bpmn: flow references unknown node '${flow.sourceId}'. Declare it, e.g. 'task ${flow.sourceId} "..."', or fix the id${didYouMean(flow.sourceId, knownIds)}.`
      );
    }
    if (!dst) {
      errors.push(
        `bpmn: flow references unknown node '${flow.targetId}'. Declare it, e.g. 'task ${flow.targetId} "..."', or fix the id${didYouMean(flow.targetId, knownIds)}.`
      );
    }
    if (src && dst) {
      validFlows.push(flow);
    }
  }

  // Rule 8 — lanes must sit inside a pool.
  for (const lane of model.lanes) {
    if (!lane.poolId) {
      errors.push(
        `bpmn: lane '${lane.label}' is declared outside any pool. Lanes must sit inside a pool. Wrap it, e.g. 'pool "Order handling"' then indent 'lane "${lane.label}"'.`
      );
    }
  }

  const sequenceFlows = validFlows.filter((flow) => flow.kind === 'sequence');
  const messageFlows = validFlows.filter((flow) => flow.kind === 'message');

  const outByNode = new Map<string, BpmnFlow[]>();
  const inByNode = new Map<string, BpmnFlow[]>();
  for (const flow of sequenceFlows) {
    (outByNode.get(flow.sourceId) ?? outByNode.set(flow.sourceId, []).get(flow.sourceId)!).push(
      flow
    );
    (inByNode.get(flow.targetId) ?? inByNode.set(flow.targetId, []).get(flow.targetId)!).push(flow);
  }

  // Rule 3 — start/end flow-direction constraints.
  for (const node of model.nodes) {
    if (node.kind === 'event' && node.position === 'start') {
      const incoming = inByNode.get(node.id);
      if (incoming && incoming.length > 0) {
        errors.push(
          `bpmn: start event '${node.id}' has an incoming sequence flow from '${incoming[0].sourceId}'. Start events begin a process and cannot be a flow target. Use an 'intermediate' event here, or make '${node.id}' a task.`
        );
      }
    }
    if (node.kind === 'event' && node.position === 'end') {
      const outgoing = outByNode.get(node.id);
      if (outgoing && outgoing.length > 0) {
        errors.push(
          `bpmn: end event '${node.id}' has an outgoing sequence flow to '${outgoing[0].targetId}'. End events terminate a path and cannot have outgoing flows. Use an 'intermediate' event, or move the flow to start from an earlier node.`
        );
      }
    }
  }

  // Rule 4 / 6 — gateway arity, parallel-condition, single default.
  const gatewayTypeName: Record<BpmnGateway['gateway'], string> = {
    exclusive: 'exclusive',
    parallel: 'parallel',
    inclusive: 'inclusive',
    event: 'event-based',
  };
  for (const node of model.nodes) {
    if (node.kind !== 'gateway') {
      continue;
    }
    const outgoing = outByNode.get(node.id) ?? [];
    const incoming = inByNode.get(node.id) ?? [];
    const typeName = gatewayTypeName[node.gateway];

    if (
      (node.gateway === 'exclusive' || node.gateway === 'inclusive') &&
      outgoing.length === 1 &&
      incoming.length <= 1
    ) {
      errors.push(
        `bpmn: ${typeName} gateway '${node.id}' has 1 outgoing flow. A diverging gateway needs 2 or more outgoing sequence flows. Add another branch, e.g. '${node.id} -- no --> e2', or replace '${node.id}' with a task if no decision is made here.`
      );
    }

    if (node.gateway === 'parallel') {
      const conditional = outgoing.find((flow) => flow.label !== undefined);
      if (conditional) {
        errors.push(
          `bpmn: parallel gateway '${node.id}' has a condition '${conditional.label}' on the flow to '${conditional.targetId}'. Parallel gateways activate all branches unconditionally — conditions are not allowed. Remove the condition, or change '${node.id}' to 'xor' or 'or'.`
        );
      }
    }

    const defaults = outgoing.filter((flow) => flow.isDefault);
    if (defaults.length > 1) {
      errors.push(
        `bpmn: ${typeName} gateway '${node.id}' has ${defaults.length} default flows (to '${defaults[0].targetId}' and to '${defaults[1].targetId}'). A gateway may have at most one default flow. Keep 'default' on exactly one branch and give the other a condition.`
      );
    }
  }

  // Rule 5 — a condition on a branch that has no gateway. Only fires when the
  // non-gateway source actually branches (>1 outgoing), which is the real
  // "decision without a gateway" mistake; a single named flow is left alone.
  for (const [sourceId, flows] of outByNode) {
    const src = nodeById.get(sourceId);
    if (!src || src.kind === 'gateway') {
      continue;
    }
    if (flows.length < 2) {
      continue;
    }
    const conditional = flows.find((flow) => flow.label !== undefined);
    if (conditional) {
      const kind = src.kind === 'event' ? 'event' : 'task';
      errors.push(
        `bpmn: the flow '${sourceId} -- "${conditional.label}" --> ${conditional.targetId}' has a condition but '${sourceId}' is a ${kind}. Conditions belong on flows leaving an exclusive (xor) or inclusive (or) gateway. Insert a gateway, e.g. '${sourceId} --> g1' then 'g1 -- ${conditional.label} --> ${conditional.targetId}'.`
      );
    }
  }

  // Rule 7 — message flows cross pools; sequence flows stay within a pool.
  for (const flow of messageFlows) {
    const src = nodeById.get(flow.sourceId)!;
    const dst = nodeById.get(flow.targetId)!;
    if (src.poolId && dst.poolId && src.poolId === dst.poolId) {
      errors.push(
        `bpmn: message flow '${flow.sourceId} ==> ${flow.targetId}' connects two nodes in the same pool '${poolLabelOf(model, src.poolId)}'. Message flows may only cross pool boundaries. Use a sequence flow '-->' within a pool, or move one endpoint to another pool.`
      );
    }
  }
  for (const flow of sequenceFlows) {
    const src = nodeById.get(flow.sourceId)!;
    const dst = nodeById.get(flow.targetId)!;
    if (src.poolId && dst.poolId && src.poolId !== dst.poolId) {
      errors.push(
        `bpmn: sequence flow '${flow.sourceId} --> ${flow.targetId}' crosses from pool '${poolLabelOf(model, src.poolId)}' to pool '${poolLabelOf(model, dst.poolId)}'. Sequence flows stay inside one pool. Use a message flow '==>' between pools.`
      );
    }
  }

  // Rules 1 & 2 — reachability over the sequence-flow graph, scoped per process
  // (a pool, or the pool-less top level). A pool that has neither a start nor an
  // end event is a black-box collaboration participant and is exempt.
  const forward = new Map<string, string[]>();
  const backward = new Map<string, string[]>();
  for (const flow of sequenceFlows) {
    (forward.get(flow.sourceId) ?? forward.set(flow.sourceId, []).get(flow.sourceId)!).push(
      flow.targetId
    );
    (backward.get(flow.targetId) ?? backward.set(flow.targetId, []).get(flow.targetId)!).push(
      flow.sourceId
    );
  }
  const reachSet = (starts: string[], graph: Map<string, string[]>): Set<string> => {
    const seen = new Set<string>(starts);
    const stack = [...starts];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const next of graph.get(cur) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    return seen;
  };

  const flowNodes = model.nodes.filter(isFlowNode);
  const scopes = new Map<string, BpmnNode[]>();
  for (const node of flowNodes) {
    const key = node.poolId ?? '__top__';
    (scopes.get(key) ?? scopes.set(key, []).get(key)!).push(node);
  }

  for (const scopeNodes of scopes.values()) {
    if (scopeNodes.length <= 1) {
      continue;
    }
    const startIds = scopeNodes
      .filter((n) => n.kind === 'event' && n.position === 'start')
      .map((n) => n.id);
    const endIds = scopeNodes
      .filter((n) => n.kind === 'event' && n.position === 'end')
      .map((n) => n.id);

    if (endIds.length > 0) {
      const canReachEnd = reachSet(endIds, backward);
      for (const node of scopeNodes) {
        if (node.kind === 'event' && node.position === 'end') {
          continue;
        }
        if (!canReachEnd.has(node.id)) {
          errors.push(
            `bpmn: node '${node.id}' has no path to an end event. In BPMN every flow node must reach at least one end event. Add an outgoing sequence flow from '${node.id}', e.g. '${node.id} --> ${endIds[0]}', or connect it to an existing node that already reaches an end.`
          );
        }
      }
    }

    if (startIds.length > 0) {
      const reachableFromStart = reachSet(startIds, forward);
      for (const node of scopeNodes) {
        if (node.kind === 'event' && node.position === 'start') {
          continue;
        }
        if (!reachableFromStart.has(node.id)) {
          errors.push(
            `bpmn: node '${node.id}' is unreachable — no start event leads to it. Add an incoming sequence flow, e.g. '${startIds[0]} --> ${node.id}', or remove '${node.id}'.`
          );
        }
      }
    }
  }

  return errors;
}
