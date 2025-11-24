import { vi } from 'vitest';
import { drawGroups } from './svgDraw.js';

// Minimal Mock for D3 element
const MockD3 = (name: string) => {
  const children: any[] = [];
  const elem: any = {
    __name: name,
    __children: children,
  };
  elem.append = (tag: string) => {
    const child = MockD3(tag);
    children.push(child);
    return child;
  };
  elem.attr = vi.fn(() => elem);
  elem.html = vi.fn(() => elem);
  return elem;
};

describe('architecture svgDraw drawGroups', () => {
  it('calculates group bbox from children getBBox when available', async () => {
    const groupsEl = MockD3('svg');

    // Mock cy with one group node that has two children
    const child1: any = {
      id: () => 's1',
      position: () => ({ x: 100, y: 50 }),
      data: () => ({ width: 40, height: 20 }),
      children: () => [],
    };
    const child2: any = {
      id: () => 's2',
      position: () => ({ x: 200, y: 150 }),
      data: () => ({ width: 60, height: 30 }),
      children: () => [],
    };

    const groupNode: any = {
      data: () => ({ id: 'g1', type: 'group', label: 'My Group' }),
      children: () => [child1, child2],
      boundingBox: () => ({ x1: 0, y1: 0, x2: 0, y2: 0 }),
    };

    const cy: any = {
      nodes: () => [groupNode],
    };

    // Mock db with getElementById returning elements that have node().getBBox()
    const db: any = {
      getConfigField: (k: string) => {
        if (k === 'padding') {
          return 10;
        }
        if (k === 'fontSize') {
          return 12;
        }
        if (k === 'iconSize') {
          return 24;
        }
        return 0;
      },
      getElementById: (id: string) => {
        if (id === 's1') {
          return { node: () => ({ getBBox: () => ({ width: 40, height: 20 }) }) };
        }
        if (id === 's2') {
          return { node: () => ({ getBBox: () => ({ width: 60, height: 30 }) }) };
        }
        return null;
      },
      setElementForId: vi.fn(),
    };

    await drawGroups(groupsEl, cy, db);

    // Expect a rect appended for the group
    const rects = groupsEl.__children.filter((c: any) => c.__name === 'rect');
    expect(rects.length).toBe(1);
    const rect = rects[0];
    // attr should have been called to set id, x, y, width, height
    expect(rect.attr).toHaveBeenCalledWith('id', 'group-g1');
    expect(rect.attr).toHaveBeenCalledWith('class', 'node-bkg');
    // db.setElementForId should have been called with group id
    expect(db.setElementForId).toHaveBeenCalledWith('g1', rect);
  });

  it('falls back to cytoscape boundingBox when no children', async () => {
    const groupsEl = MockD3('svg');

    const groupNode: any = {
      data: () => ({ id: 'g2', type: 'group', label: 'Empty Group' }),
      children: () => [],
      boundingBox: () => ({ x1: 10, y1: 20, x2: 110, y2: 120 }),
    };
    const cy: any = { nodes: () => [groupNode] };

    const db: any = {
      getConfigField: (k: string) => (k === 'padding' ? 8 : k === 'iconSize' ? 24 : 12),
      getElementById: () => null,
      setElementForId: vi.fn(),
    };

    await drawGroups(groupsEl, cy, db);

    const rects = groupsEl.__children.filter((c: any) => c.__name === 'rect');
    expect(rects.length).toBe(1);
    const rect = rects[0];
    expect(rect.attr).toHaveBeenCalledWith('id', 'group-g2');
    expect(db.setElementForId).toHaveBeenCalledWith('g2', rect);
  });
});

import { describe } from 'vitest';
import { draw } from './architectureRenderer.js';
import { Diagram } from '../../Diagram.js';
import { addDetector } from '../../diagram-api/detectType.js';
import architectureDetector from './architectureDetector.js';
import { ensureNodeFromSelector, jsdomIt } from '../../tests/util.js';

const { id, detector, loader } = architectureDetector;

addDetector(id, detector, loader); // Add architecture schemas to Mermaid

describe('architecture diagram SVGs', () => {
  jsdomIt('should add ids', async () => {
    const svgNode = await drawDiagram(`
      architecture-beta
        group api(cloud)[API]

        service db(database)[Database] in api
        service disk1(disk)[Storage] in api
        service disk2(disk)[Storage] in api
        service server(server)[Server] in api

        db:L -- R:server
        disk1:T -- B:server
        disk2:T -- B:db
    `);

    const nodesForGroup = svgNode.querySelectorAll(`#group-api`);
    expect(nodesForGroup.length).toBe(1);

    const serviceIds = [...svgNode.querySelectorAll(`[id^=service-]`)].map(({ id }) => id).sort();
    expect(serviceIds).toStrictEqual([
      'service-db',
      'service-disk1',
      'service-disk2',
      'service-server',
    ]);

    const edgeIds = [...svgNode.querySelectorAll(`.edge[id^=L_]`)].map(({ id }) => id).sort();
    expect(edgeIds).toStrictEqual(['L_db_server_0', 'L_disk1_server_0', 'L_disk2_db_0']);
  });
});

async function drawDiagram(diagramText: string): Promise<Element> {
  const diagram = await Diagram.fromText(diagramText, {});
  await draw('NOT_USED', 'svg', '1.0.0', diagram);
  return ensureNodeFromSelector('#svg');
}
