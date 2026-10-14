import { createBadgeLayer } from './badges.js';
import { wrapText } from './text.js';
import type { LayoutData } from '../rendering-util/types.js';
import { deploymentBlockers } from './model.js';
import type { Threat, ThreatModel } from './model.js';

const namespace = 'http://www.w3.org/2000/svg';
const colors = {
  critical: '#991b1b',
  high: '#c2410c',
  medium: '#a16207',
  low: '#1d4ed8',
  info: '#475569',
};
const rank = ['critical', 'high', 'medium', 'low', 'info'];
const active = (threat: Threat) => !['mitigated', 'excluded'].includes(threat.status);

/** Pure SVG, no HTML interpolation, handlers, external resources, or clickable URLs. */
export function renderThreatModel(svg: SVGSVGElement, model: ThreatModel, data: LayoutData): void {
  const make = <K extends keyof SVGElementTagNameMap>(tag: K, parent: Element) => {
    const node = svg.ownerDocument.createElementNS(namespace, tag);
    parent.appendChild(node);
    return node;
  };
  const byId = new Map([...svg.querySelectorAll('[id]')].map((node) => [node.id, node]));
  const addBadge = createBadgeLayer(svg);
  for (const element of model.elements) {
    const layoutNode = data.nodes.find((node) => node.id === element.id);
    const domId =
      element.kind === 'flow'
        ? `${data.diagramId}-${element.id}`
        : (layoutNode?.domId ?? element.id);
    const target = byId.get(domId);
    if (!target) {
      continue;
    } // Collapsed subgraphs can hide descendants; the register retains them.
    const threats = model.threats.filter((threat) => threat.targets.includes(element.id));
    target.setAttribute('data-threat-element', element.id);
    target.setAttribute('data-threat-ids', threats.map((threat) => threat.id).join(' '));
    const title = make('title', target);
    title.textContent = [
      `${element.id} (${element.kind})`,
      element.description ?? '',
      ...threats.map(
        (threat) => `${threat.id}: ${threat.title} [${threat.severity}/${threat.status}]`
      ),
    ]
      .filter(Boolean)
      .join('\n');
    const unresolved = threats
      .filter(active)
      .sort((a, b) => rank.indexOf(a.severity) - rank.indexOf(b.severity));
    const color = unresolved.length
      ? colors[unresolved[0].severity]
      : threats.length
        ? '#15803d'
        : '#475569';
    const shapes =
      element.kind === 'flow'
        ? [target]
        : [...target.children].filter((child) =>
            ['rect', 'circle', 'ellipse', 'polygon', 'path'].includes(child.tagName)
          );
    for (const shape of shapes) {
      if (!(shape instanceof svg.ownerDocument.defaultView!.SVGElement)) {
        continue;
      }
      if (threats.length || element.kind === 'boundary') {
        shape.style.setProperty('stroke', color, 'important');
        shape.style.setProperty('stroke-width', '3px', 'important');
      }
      if (element.kind === 'boundary') {
        shape.style.setProperty('stroke-dasharray', '8 5', 'important');
      }
    }
    if (threats.length) {
      const label =
        threats
          .slice(0, 3)
          .map((threat) => threat.id)
          .join(', ') + (threats.length > 3 ? ` +${threats.length - 3}` : '');
      addBadge(
        target as SVGGraphicsElement,
        element.id,
        element.kind === 'flow',
        label,
        `${element.id}: ${threats.map((threat) => `${threat.id} ${threat.title}`).join('; ')}`,
        color
      );
    }
  }

  const box = svg.getBBox();
  const report = make('g', svg);
  report.setAttribute('class', 'threat-model-register');
  report.setAttribute('role', 'group');
  report.setAttribute('aria-label', 'Threat model register');
  // Keep a readable logical text size, then scale the whole register to the
  // chart width. A wide architecture must not shrink the report into a tiny
  // fixed-width column when the containing SVG is fitted to the viewport.
  const reportWidth = Math.max(500, Math.min(800, box.width));
  const reportScale = Math.max(1, box.width / reportWidth);
  report.setAttribute(
    'transform',
    `translate(${box.x}, ${box.y + box.height + 24}) scale(${reportScale})`
  );
  const background = make('rect', report);
  background.setAttribute('fill', '#fff');
  background.setAttribute('stroke', '#94a3b8');
  background.setAttribute('rx', '6');
  let y = 26;
  const x = 12;
  const top = 0;
  const line = (text: string, bold = false, color = '#0f172a') => {
    const style = `font: ${bold ? 'bold ' : ''}13px monospace; fill: ${color}`;
    const probe = make('text', report);
    probe.setAttribute('style', style);
    const chunks = wrapText(text, reportWidth - 24, (candidate) => {
      probe.textContent = candidate;
      return probe.getComputedTextLength?.() ?? [...candidate].length * 8;
    });
    probe.remove();
    for (const chunk of chunks) {
      const label = make('text', report);
      label.setAttribute('x', String(x));
      label.setAttribute('y', String(y));
      label.setAttribute('style', style);
      label.textContent = chunk;
      y += 19;
    }
  };
  line(
    `${model.title ?? model.id} — ${model.state.toUpperCase()} — threat model v${model.version}`,
    true
  );
  const blockers = deploymentBlockers(model);
  line(
    blockers.length
      ? `Deployment review required: ${blockers.join('; ')}`
      : 'No modeled deployment blockers (not a security approval)',
    true
  );
  line(
    'Outline = highest unresolved severity; green = resolved/excluded; dashed box = trust boundary.'
  );
  line(
    `${model.elements.length} annotated elements; ${model.threats.length} recorded threats.`,
    true
  );
  for (const kind of ['actor', 'process', 'store', 'flow', 'boundary'] as const) {
    const elements = model.elements.filter((element) => element.kind === kind);
    if (elements.length) {
      line(`${kind}: ${elements.map((element) => element.id).join(', ')}`);
    }
  }
  line('Full element descriptions, asset mappings and context are retained in model metadata.');
  if (!model.threats.length) {
    line('No threats recorded — this does not establish completeness.');
  }
  for (const threat of model.threats) {
    y += 10;
    line(
      `${threat.id} | ${threat.severity.toUpperCase()} | ${threat.status} | ${threat.title}`,
      true,
      active(threat) ? colors[threat.severity] : '#15803d'
    );
    line(
      `On: ${threat.targets.join(', ')}${threat.category ? ` | STRIDE: ${threat.category}` : ''}`
    );
    line(threat.description);
    if (threat.score) {
      line(`Score: ${threat.score.value} (${threat.score.method}) — ${threat.score.rationale}`);
    }
    if (threat.decision) {
      line(`Decision: ${threat.decision}`);
    }
    if (threat.mitigation) {
      line(`Mitigation: ${threat.mitigation}`);
    }
    if (threat.tickets?.length) {
      line(`Tasks: ${threat.tickets.join(', ')}`);
    }
    if (threat.evidence?.length) {
      line(`Evidence: ${threat.evidence.join(', ')}`);
    }
  }
  background.setAttribute('x', '0');
  background.setAttribute('y', String(top));
  background.setAttribute('width', String(reportWidth));
  background.setAttribute('height', String(y - top + 8));
}
