import { db } from './architectureDb.js';
import { describe } from 'vitest';
import { draw } from './architectureRenderer.js';
import { Diagram } from '../../Diagram.js';
import { addDetector } from '../../diagram-api/detectType.js';
import architectureDetector from './architectureDetector.js';
import { ensureNodeFromSelector, jsdomIt } from '../../tests/util.js';

const { id, detector, loader } = architectureDetector;
const { clear } = db;

addDetector(id, detector, loader); // Add architecture schemas to Mermaid

describe('architecture diagram SVGs', () => {
  beforeEach(() => {
    clear();
  });

  jsdomIt('should add ids to group nodes', async () => {
    const groupId = 'api';
    const serviceId = 'db';
    const svgNode = await drawDiagram(`
      architecture-beta
        group ${groupId}[API]
        service ${serviceId}[Database] in api
    `);

    const nodesForGroup = svgNode.querySelectorAll(`#group-${groupId}`);
    expect(nodesForGroup.length).toBe(1);

    const nodesForService = svgNode.querySelectorAll(`#service-${serviceId}`);
    expect(nodesForService.length).toBe(1);
  });
});

async function drawDiagram(diagramText: string): Promise<Element> {
  const diagram = await Diagram.fromText(diagramText, {});
  await draw('NOT_USED', 'svg', '1.0.0', diagram);
  return ensureNodeFromSelector('#svg');
}
