import { describe, it, expect, beforeEach } from 'vitest';
import type { ContentTabs } from '@mermaid-js/parser';
import { parser } from './parser.js';
import db from './db.js';
import { computeWireframeLayout } from './layout.js';

describe('wireframe showTabs multi-panel layout', () => {
  beforeEach(() => {
    db.clear();
    // @ts-expect-error - yy DB instance passed at runtime by Mermaid
    parser.parser.yy = db;
  });

  it('should render single active panel when showTabs is not set', async () => {
    const input = `wireframe-beta size=panel
tabs ["General", "Security"] active=1
  tab "General"
    textfield "Name"
  end
  tab "Security"
    password "Password"
  end
end`;
    await expect(parser.parse(input)).resolves.not.toThrow();

    const components = db.getComponents();
    expect(components).toHaveLength(1);

    const layout = computeWireframeLayout(components, 600, 0, 0);
    expect(layout.nodes).toHaveLength(1);

    const tabsNode = layout.nodes[0];
    // Without showTabs, tabsNode active=1 renders Tab 1 (General / TextField)
    expect(tabsNode.children?.[0]?.astNode.$type).toBe('TextField');
  });

  it('should generate side-by-side variant nodes for all tabs when showTabs is set', async () => {
    const input = `wireframe-beta size=panel
tabs ["General", "Security"] showTabs
  tab "General"
    textfield "Name"
  end
  tab "Security"
    password "Password"
  end
end`;
    await expect(parser.parse(input)).resolves.not.toThrow();

    const components = db.getComponents();
    expect(components).toHaveLength(1);

    const layout = computeWireframeLayout(components, 600, 0, 0);
    expect(layout.nodes).toHaveLength(1);

    const tabsNode = layout.nodes[0];
    expect(tabsNode.children).toHaveLength(2);

    const var1 = tabsNode.children![0];
    const var2 = tabsNode.children![1];

    expect((var1.astNode as ContentTabs).activeTab).toBe(1);
    expect((var2.astNode as ContentTabs).activeTab).toBe(2);

    expect(var1.x).toBe(0);
    expect(var2.x).toBeGreaterThan(var1.x);
  });

  it('should filter specific tab indices when showTabs="1,3" is set', async () => {
    const input = `wireframe-beta size=panel
tabs ["Tab 1", "Tab 2", "Tab 3"] showTabs="1,3"
  tab "Tab 1"
    label "Tab 1 content"
  end
  tab "Tab 2"
    label "Tab 2 content"
  end
  tab "Tab 3"
    label "Tab 3 content"
  end
end`;
    await expect(parser.parse(input)).resolves.not.toThrow();

    const components = db.getComponents();
    expect(components).toHaveLength(1);

    const layout = computeWireframeLayout(components, 600, 0, 0);
    expect(layout.nodes).toHaveLength(1);

    const tabsNode = layout.nodes[0];
    expect(tabsNode.children).toHaveLength(2);

    const var1 = tabsNode.children![0];
    const var2 = tabsNode.children![1];

    expect((var1.astNode as ContentTabs).activeTab).toBe(1);
    expect((var2.astNode as ContentTabs).activeTab).toBe(3);
  });

  it('should support unquoted numbers like showTabs=1,3', async () => {
    const input = `wireframe-beta size=panel
tabs ["Tab 1", "Tab 2", "Tab 3"] showTabs=1,3
  tab "Tab 1"
    label "Tab 1 content"
  end
  tab "Tab 2"
    label "Tab 2 content"
  end
  tab "Tab 3"
    label "Tab 3 content"
  end
end`;
    await expect(parser.parse(input)).resolves.not.toThrow();

    const components = db.getComponents();
    const layout = computeWireframeLayout(components, 600, 0, 0);
    const tabsNode = layout.nodes[0];
    expect(tabsNode.children).toHaveLength(2);

    const var1 = tabsNode.children![0];
    const var2 = tabsNode.children![1];

    expect((var1.astNode as ContentTabs).activeTab).toBe(1);
    expect((var2.astNode as ContentTabs).activeTab).toBe(3);
  });

  it('should match tab IDs/slugs like showTabs="tab-1,tab-3"', async () => {
    const input = `wireframe-beta size=panel
tabs ["Tab 1", "Tab 2", "Tab 3"] showTabs="tab-1,tab-3"
  tab "Tab 1"
    label "Tab 1 content"
  end
  tab "Tab 2"
    label "Tab 2 content"
  end
  tab "Tab 3"
    label "Tab 3 content"
  end
end`;
    await expect(parser.parse(input)).resolves.not.toThrow();

    const components = db.getComponents();
    const layout = computeWireframeLayout(components, 600, 0, 0);
    const tabsNode = layout.nodes[0];
    expect(tabsNode.children).toHaveLength(2);

    const var1 = tabsNode.children![0];
    const var2 = tabsNode.children![1];

    expect((var1.astNode as ContentTabs).activeTab).toBe(1);
    expect((var2.astNode as ContentTabs).activeTab).toBe(3);
  });

  it('should match explicit tab IDs like showTabs=gen,sec', async () => {
    const input = `wireframe-beta size=panel
tabs ["General", "Security"] showTabs=gen,sec
  tab "General" id=gen
    textfield "Username"
  end
  tab "Security" id=sec
    password "Password"
  end
end`;
    await expect(parser.parse(input)).resolves.not.toThrow();

    const components = db.getComponents();
    const layout = computeWireframeLayout(components, 600, 0, 0);
    const tabsNode = layout.nodes[0];
    expect(tabsNode.children).toHaveLength(2);

    const var1 = tabsNode.children![0];
    const var2 = tabsNode.children![1];

    expect((var1.astNode as ContentTabs).activeTab).toBe(1);
    expect((var2.astNode as ContentTabs).activeTab).toBe(2);
  });

  it('should support mixing slugs/IDs and numbers like showTabs=general,3', async () => {
    const input = `wireframe-beta size=panel
tabs ["General", "Security", "Notifications"] showTabs=general,3
  tab "General"
    textfield "Username"
  end
  tab "Security"
    password "Password"
  end
  tab "Notifications"
    checkbox "Email" checked
  end
end`;
    await expect(parser.parse(input)).resolves.not.toThrow();

    const components = db.getComponents();
    const layout = computeWireframeLayout(components, 600, 0, 0);
    const tabsNode = layout.nodes[0];
    expect(tabsNode.children).toHaveLength(2);

    const var1 = tabsNode.children![0];
    const var2 = tabsNode.children![1];

    expect((var1.astNode as ContentTabs).activeTab).toBe(1);
    expect((var2.astNode as ContentTabs).activeTab).toBe(3);
  });

  it('should ignore active parameter when showTabs is set', async () => {
    const input = `wireframe-beta size=panel
tabs ["General", "Security"] active=2 showTabs
  tab "General"
    textfield "Name"
  end
  tab "Security"
    password "Password"
  end
end`;
    await expect(parser.parse(input)).resolves.not.toThrow();

    const components = db.getComponents();
    const layout = computeWireframeLayout(components, 600, 0, 0);
    const tabsNode = layout.nodes[0];
    expect(tabsNode.children).toHaveLength(2);
  });

  it('should default to first tab (active=1) when neither active nor showTabs is set', async () => {
    const input = `wireframe-beta size=panel
tabs ["General", "Security"]
  tab "General"
    textfield "Name"
  end
  tab "Security"
    password "Password"
  end
end`;
    await expect(parser.parse(input)).resolves.not.toThrow();

    const components = db.getComponents();
    const layout = computeWireframeLayout(components, 600, 0, 0);
    const tabsNode = layout.nodes[0];
    expect(tabsNode.children?.[0]?.astNode.$type).toBe('TextField');
  });

  it('should calculate tree height including expanded children', async () => {
    const input = `wireframe-beta size=panel
tree "Explorer"
  node "src" expanded > "index.ts", "utils.ts"
  node "public" > "favicon.ico"
end`;
    await expect(parser.parse(input)).resolves.not.toThrow();

    const components = db.getComponents();
    const layout = computeWireframeLayout(components, 600, 0, 0);
    const treeNode = layout.nodes[0];
    // 1 node ("src") + 2 children ("index.ts", "utils.ts") + 1 node ("public") = 4 lines * 22 = 88px
    expect(treeNode.height).toBe(88);
  });

  it('should allocate full container width per variant when showTabs is set', async () => {
    const input = `wireframe-beta size=panel
tabs ["General", "Security"] showTabs
  tab "General"
    textfield "Name"
  end
  tab "Security"
    password "Password"
  end
end`;
    await expect(parser.parse(input)).resolves.not.toThrow();

    const components = db.getComponents();
    const layout = computeWireframeLayout(components, 570, 15, 0);
    const tabsNode = layout.nodes[0];
    expect(tabsNode.children).toHaveLength(2);

    const var1 = tabsNode.children![0];
    const var2 = tabsNode.children![1];

    // Each variant gets full container width (570)
    expect(var1.width).toBe(570);
    expect(var2.width).toBe(570);
    // Distance between variant starts is full canvas width (600) + gap (16) = 616
    expect(var2.x - var1.x).toBe(616);
  });
});
