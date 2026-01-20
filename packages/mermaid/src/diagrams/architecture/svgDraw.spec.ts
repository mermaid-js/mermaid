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
        group api('cloud')['API']

        service db('database')['Database'] in api
        service disk1('disk')['Storage'] in api
        service disk2('disk')['Storage'] in api
        service server('server')['Server'] in api

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
