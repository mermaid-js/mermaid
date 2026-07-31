import { describe } from 'vitest';
import { draw } from './architectureRenderer.js';
import { Diagram } from '../../Diagram.js';
import { addDetector } from '../../diagram-api/detectType.js';
import architectureDetector from './architectureDetector.js';
import { ensureNodeFromSelector, jsdomIt } from '../../tests/util.js';

const { id, detector, loader } = architectureDetector;

addDetector(id, detector, loader); // Add architecture schemas to Mermaid

// Cytoscape layout is CPU-intensive and can exceed the default 5s timeout
// when running alongside the full test suite.
describe('architecture diagram SVGs', { timeout: 15_000 }, () => {
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

    const nodesForGroup = svgNode.querySelectorAll(`#svg-group-api`);
    expect(nodesForGroup.length).toBe(1);

    const serviceIds = [...svgNode.querySelectorAll(`[id^=svg-service-]`)]
      .map(({ id }) => id)
      .sort();
    expect(serviceIds).toStrictEqual([
      'svg-service-db',
      'svg-service-disk1',
      'svg-service-disk2',
      'svg-service-server',
    ]);

    const edgeIds = [...svgNode.querySelectorAll(`.edge[id^=svg-L_]`)].map(({ id }) => id).sort();
    expect(edgeIds).toStrictEqual([
      'svg-L_db_server_0',
      'svg-L_disk1_server_0',
      'svg-L_disk2_db_0',
    ]);
  });
});

async function drawDiagram(diagramText: string): Promise<Element> {
  const diagram = await Diagram.fromText(diagramText, {});
  await draw('NOT_USED', 'svg', '1.0.0', diagram);
  return ensureNodeFromSelector('#svg');
}
