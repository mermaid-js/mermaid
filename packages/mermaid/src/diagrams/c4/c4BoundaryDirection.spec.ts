import { mermaidAPI } from '../../mermaidAPI.js';
import c4Db from './c4Db.js';

const diagram = `Container_Boundary(shop, "Web shop") {
  Container(cart, "Cart", "Python")
  Container_Boundary(checkout, "Checkout") {
    Container(order, "Order", "Python")
  }
}
Container_Boundary(warehouse, "Warehouse") {
  Container(pick, "Pick", "Go")
}`;

const withConfig = (c4Config: string, body = diagram) => `---
config:
  c4:
${c4Config}
---
C4Container
${body}`;

const dirsAfterParsing = async (text: string) => {
  await mermaidAPI.parse(text);
  return Object.fromEntries(
    c4Db
      .getData()
      .nodes.filter((node) => node.isGroup)
      .map((node) => [node.id, node.dir])
  );
};

describe('c4.boundaryDirection in front matter', () => {
  it.each(['LR', 'RL', 'BT', 'TB'])('reaches every boundary as %s', async (direction) => {
    const dirs = await dirsAfterParsing(withConfig(`    boundaryDirection: ${direction}`));

    expect(dirs).toEqual({ shop: direction, checkout: direction, warehouse: direction });
  });

  it('yields to a direction statement inside a boundary', async () => {
    const dirs = await dirsAfterParsing(
      withConfig(
        '    boundaryDirection: LR',
        diagram.replace(
          'Container(pick, "Pick", "Go")',
          'direction TB\n  Container(pick, "Pick", "Go")'
        )
      )
    );

    expect(dirs).toEqual({ shop: 'LR', checkout: 'LR', warehouse: 'TB' });
  });

  it('sets nothing when the diagram does not ask', async () => {
    const dirs = await dirsAfterParsing(`C4Container\n${diagram}`);

    expect(dirs).toEqual({ shop: undefined, checkout: undefined, warehouse: undefined });
  });

  it('does not carry over to the next diagram', async () => {
    await dirsAfterParsing(withConfig('    boundaryDirection: LR'));
    const dirs = await dirsAfterParsing(`C4Container\n${diagram}`);

    expect(dirs).toEqual({ shop: undefined, checkout: undefined, warehouse: undefined });
  });

  it.each(['sideways', 'lr', 'TD'])('ignores %s, which is not a direction', async (value) => {
    const dirs = await dirsAfterParsing(withConfig(`    boundaryDirection: ${value}`));

    expect(dirs).toEqual({ shop: undefined, checkout: undefined, warehouse: undefined });
  });
});
