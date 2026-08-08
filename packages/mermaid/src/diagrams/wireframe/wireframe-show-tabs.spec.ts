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
    const input = `wireframe size=panel
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
    const input = `wireframe size=panel
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

    expect((var1.astNode as ContentTabs).activeTab).toBe(0);
    expect((var2.astNode as ContentTabs).activeTab).toBe(1);

    expect(var1.x).toBe(0);
    expect(var2.x).toBeGreaterThan(var1.x);
  });

  it('should filter specific tab indices when showTabs="1,3" is set', async () => {
    const input = `wireframe size=panel
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

    expect((var1.astNode as ContentTabs).activeTab).toBe(0);
    expect((var2.astNode as ContentTabs).activeTab).toBe(2);
  });

  it('should support unquoted numbers like showTabs=1,3', async () => {
    const input = `wireframe size=panel
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

    expect((var1.astNode as ContentTabs).activeTab).toBe(0);
    expect((var2.astNode as ContentTabs).activeTab).toBe(2);
  });

  it('should match tab IDs/slugs like showTabs=tab-1,tab-3', async () => {
    const input = `wireframe size=panel
tabs ["Tab 1", "Tab 2", "Tab 3"] showTabs=tab-1,tab-3
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

    expect((var1.astNode as ContentTabs).activeTab).toBe(0);
    expect((var2.astNode as ContentTabs).activeTab).toBe(2);
  });

  it('should match explicit tab IDs like showTabs=gen,sec', async () => {
    const input = `wireframe size=panel
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

    expect((var1.astNode as ContentTabs).activeTab).toBe(0);
    expect((var2.astNode as ContentTabs).activeTab).toBe(1);
  });
});
