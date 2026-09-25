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
  const byId = new Map(Array.from(svg.querySelectorAll('[id]')).map((node) => [node.id, node]));
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
        : Array.from(target.children).filter((child) =>
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
      const bounds = (target as SVGGraphicsElement).getBBox();
      const badge = make('g', element.kind === 'flow' ? target.parentElement! : target);
      badge.setAttribute('class', 'threat-model-badge');
      badge.setAttribute('data-threat-target', element.id);
      const label =
        threats
          .slice(0, 3)
          .map((threat) => threat.id)
          .join(', ') + (threats.length > 3 ? ` +${threats.length - 3}` : '');
      const width = label.length * 7.5 + 12;
      const badgeX =
        element.kind === 'flow'
          ? bounds.x + bounds.width / 2 - width / 2
          : bounds.x + bounds.width - width;
      badge.setAttribute('transform', `translate(${badgeX}, ${bounds.y - 24})`);
      const background = make('rect', badge);
      background.setAttribute('width', String(width));
      background.setAttribute('height', '20');
      background.setAttribute('rx', '4');
      background.setAttribute('style', `fill: ${color}; stroke: white; stroke-width: 1px`);
      const text = make('text', badge);
      text.setAttribute('x', '6');
      text.setAttribute('y', '14');
      text.setAttribute('style', 'font: bold 12px monospace; fill: white');
      text.textContent = label;
      make('title', badge).textContent =
        `${element.id}: ${threats.map((threat) => `${threat.id} ${threat.title}`).join('; ')}`;
    }
  }

  const box = svg.getBBox();
  const report = make('g', svg);
  report.setAttribute('class', 'threat-model-register');
  report.setAttribute('role', 'group');
  report.setAttribute('aria-label', 'Threat model register');
  const background = make('rect', report);
  background.setAttribute('fill', '#fff');
  background.setAttribute('stroke', '#94a3b8');
  background.setAttribute('rx', '6');
  let y = box.y + box.height + 36;
  const x = box.x + 12;
  const top = y - 22;
  const line = (text: string, bold = false, color = '#0f172a') => {
    // Fixed-width wrapping also handles long unbroken evidence URLs.
    const chunks = text.match(/.{1,100}(?:\s|$)|.{1,100}/g) ?? [''];
    for (const chunk of chunks) {
      const label = make('text', report);
      label.setAttribute('x', String(x));
      label.setAttribute('y', String(y));
      label.setAttribute('style', `font: ${bold ? 'bold ' : ''}13px monospace; fill: ${color}`);
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
  for (const element of model.elements) {
    line(
      `${element.id} [${element.kind}${element.entryPoint ? ', entry point' : ''}]${element.assets?.length ? ` assets: ${element.assets.join(', ')}` : ''}`
    );
  }
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
  const bounds = report.getBBox();
  background.setAttribute('x', String(x - 12));
  background.setAttribute('y', String(top));
  background.setAttribute('width', String(Math.max(bounds.width + 24, 500)));
  background.setAttribute('height', String(y - top + 8));
}
