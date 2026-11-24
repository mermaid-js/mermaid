/**
 * Actor menus (`link` and `links`) on every participant shape, through a real `mermaid.render`.
 * The menu is placed under the box a shape records in `actor.rectData`, and the shapes drawn as a
 * glyph did not record one, so a link on them crashed the render (#2781).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import mermaid from '../../mermaid.js';

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 60, height: 20 }) as DOMRect,
  });
});

const render = async (id: string, source: string) => {
  // `loose` keeps the onclick that opens the menu, `strict` sanitizes it away.
  mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
  const { svg } = await mermaid.render(id, source);
  return new DOMParser().parseFromString(svg, 'image/svg+xml');
};

describe('actor menu', () => {
  it.each([
    'participant',
    'actor',
    'boundary',
    'control',
    'entity',
    'database',
    'queue',
    'collections',
  ])('draws the menu of a %s and opens it on click', async (type) => {
    const doc = await render(
      `menu-${type}`,
      `sequenceDiagram
    participant D@{ "type" : "${type}" } as Developer
    link D: Blog @ https://blog.contoso.com/developer
    participant G as Github
    D->>G: push code`
    );

    const popup = doc.querySelector('.actorPopupMenu')!;
    expect(popup.querySelector('a')!.textContent).toBe('Blog');
    expect(doc.querySelector('[onclick]')!.getAttribute('onclick')).toContain(`'${popup.id}'`);
  });

  it('renders the diagram from the report', async () => {
    const doc = await render(
      'menu-report',
      `sequenceDiagram
    autonumber
    actor D as Developer
    link D: Blog @ https://blog.contoso.com/developer
    link D: Slack @ https://contoso.slack.com/developer
    participant G as Github
    link G: Docs @ https://docs.github.com/en/a
    link G: Status @ https://www.githubstatus.com/
    D->>G: push code . . .`
    );

    expect(doc.querySelectorAll('.actorPopupMenu')).toHaveLength(2);
  });
});
