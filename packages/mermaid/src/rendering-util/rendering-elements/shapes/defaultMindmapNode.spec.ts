import { describe, it, expect, vi } from 'vitest';

vi.mock('./handDrawnShapeStyles.js', () => ({
  styles2String: vi.fn().mockReturnValue({ labelStyles: '', nodeStyles: '' }),
}));

vi.mock('./util.js', () => {
  const chainable = () => {
    const proxy: any = new Proxy(() => proxy, {
      get: () => proxy,
      apply: () => proxy,
    });
    return proxy;
  };
  return {
    labelHelper: vi.fn().mockResolvedValue({
      shapeSvg: chainable(),
      bbox: { width: 100, height: 50 },
      halfPadding: 5,
      label: chainable(),
    }),
    getNodeClasses: vi.fn().mockReturnValue(''),
    updateNodeBounds: vi.fn(),
  };
});

describe('defaultMindmapNode', () => {
  it('throws when node.domId is missing', async () => {
    const { defaultMindmapNode } = await import('./defaultMindmapNode.js');

    const chainable = () => {
      const proxy: any = new Proxy(() => proxy, {
        get: () => proxy,
        apply: () => proxy,
      });
      return proxy;
    };

    const parent = chainable();
    const node = { id: 'test-node', domId: '', type: 'default' } as any;

    await expect(defaultMindmapNode(parent, node)).rejects.toThrow(
      'defaultMindmapNode: node "test-node" is missing a domId'
    );
  });
});
