import { describe, it, expect, beforeEach } from 'vitest';
import type { WireframeSection } from '@mermaid-js/parser';
import detector from './detector.js';
import { parser } from './parser.js';
import db from './db.js';
import { computeWireframeLayout } from './layout.js';
import { registry } from './renderers/index.js';
import getStyles from './styles.js';
import { getConfig, updateSiteConfig } from '../../config.js';

describe('wireframe diagram', () => {
  beforeEach(() => {
    db.clear();
    // @ts-expect-error - yy DB instance passed at runtime by Mermaid
    parser.parser.yy = db;
  });

  describe('detector', () => {
    it('should detect wireframe diagram keywords', () => {
      expect(detector.detector('wireframe "User Settings" size=dialog')).toBe(true);
      expect(detector.detector('  wireframe')).toBe(true);
      expect(detector.detector('WIREFRAME "Dashboard"')).toBe(true);
      expect(detector.detector('flowchart TD')).toBe(false);
      expect(detector.detector('sequenceDiagram')).toBe(false);
    });
  });

  describe('parser & state DB integration', () => {
    it('should parse diagram title and canvas size preset', async () => {
      const input = `wireframe "App Dashboard" size=tablet`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      expect(db.getCanvasSize()).toBe('tablet');
      expect(db.getCanvasDimensions()).toEqual({ width: 768, height: 1024 });
    });

    it('should default to desktop canvas size if size is omitted', async () => {
      const input = `wireframe "Simple App"`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      expect(db.getCanvasSize()).toBe('desktop');
      expect(db.getCanvasDimensions()).toEqual({ width: 1024, height: 768 });
    });

    it('should extract top action bar buttons with primary flags', async () => {
      const input = `wireframe "Settings"
actions [Cancel] ["*Save"]
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      const actionBar = db.getActionBar();
      expect(actionBar).toBeDefined();
      expect(actionBar?.buttons).toHaveLength(2);
      expect(actionBar?.buttons[0].label).toBe('Cancel');
      expect(actionBar?.buttons[1].label).toBe('*Save');
    });

    it('should parse component hierarchy with section containers', async () => {
      const input = `wireframe "User Form"
section "Account Details"
  textfield "Username"
  password "Password"
  button "Submit"
end
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      const components = db.getComponents();
      expect(components).toHaveLength(1);

      const section = components[0] as WireframeSection;
      expect(section.$type).toBe('WireframeSection');
      expect(section.label).toBe('Account Details');
      expect(section.components).toHaveLength(3);
    });

    it('should handle accessibility titles and descriptions', async () => {
      const input = `wireframe "Accessible App"
accTitle: Main Form Title
accDescr: Accessibility description for screen readers
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      expect(db.getAccTitle()).toBe('Main Form Title');
      expect(db.getAccDescription()).toBe('Accessibility description for screen readers');
    });
  });

  describe('Two-Pass Layout Engine & Component Controls', () => {
    it('should compute horizontal alignTo positioning correctly', async () => {
      const input = `wireframe "Align Test"
button "Cancel" id=btnCancel
button "Submit" id=btnSubmit alignTo=btnCancel
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      const components = db.getComponents();
      const layout = computeWireframeLayout(components, 800, 20, 10);

      expect(layout.nodes).toHaveLength(2);
      const btnCancelNode = layout.nodes[0];
      const btnSubmitNode = layout.nodes[1];

      // btnSubmit should be positioned horizontally adjacent to btnCancel on same Y line
      expect(btnSubmitNode.y).toBe(btnCancelNode.y);
      expect(btnSubmitNode.x).toBeGreaterThan(btnCancelNode.x + btnCancelNode.width);
    });

    it('should parse and layout complex wireframe controls (checkboxes, radio, select, icons, columns, titlewindow)', async () => {
      const input = `wireframe "Form Showcase"
checkbox "Agree to Terms" checked
radiogroup "Notification Preference" [*Email, SMS]
select "Country" [USA, Canada, Germany]
icon "Star" glyph="star"
columns
  col
    titlewindow "System Metrics"
      heading "Overview"
    end
  end
  col
    textfield "Last Name"
  end
end
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      const components = db.getComponents();
      expect(components).toHaveLength(5);

      const layout = computeWireframeLayout(components, 800, 20, 10);
      expect(layout.nodes).toHaveLength(5);
      expect(layout.totalHeight).toBeGreaterThan(100);
    });

    it('should calculate custom column widths (% and px) in multi-column layout engine', async () => {
      const input = `wireframe "Custom Columns"
columns
  col 30%
    heading "Left Column"
  end
  col 70%
    heading "Right Column"
  end
end
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      const components = db.getComponents();
      expect(components).toHaveLength(1);

      const layout = computeWireframeLayout(components, 1000, 20, 10);
      expect(layout.nodes).toHaveLength(1);
      const colsNode = layout.nodes[0];
      expect(colsNode.children).toBeDefined();
      expect(colsNode.children).toHaveLength(2);

      const col1Heading = colsNode.children![0];
      const col2Heading = colsNode.children![1];

      // Total available width = 1000 - 16 (gap) = 984.
      // col1 width ~ 30% of 984 = 295.2. col2 width ~ 70% of 984 = 688.8.
      expect(col1Heading.width).toBeCloseTo(295.2, 0);
      expect(col2Heading.width).toBeCloseTo(688.8, 0);
      expect(col2Heading.x).toBeGreaterThan(col1Heading.x);
    });

    it('should correctly position ContentTabs active tab child components', async () => {
      const input = `wireframe "Tabs Test"
tabs [General, Settings] active=1
  tab "General"
    label "General Info"
  end
  tab "Settings"
    button "Save Config"
  end
end
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      const components = db.getComponents();
      expect(components).toHaveLength(1);

      const layout = computeWireframeLayout(components, 800, 20, 10);
      expect(layout.nodes).toHaveLength(1);
      const tabsNode = layout.nodes[0];
      expect(tabsNode.children![0].astNode.$type).toBe('TextElement');
    });

    it('should select second tab when active=2', async () => {
      const input = `wireframe "Tabs Test 2"
tabs [General, Settings] active=2
  tab "General"
    label "General Info"
  end
  tab "Settings"
    button "Save Config"
  end
end
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      const components = db.getComponents();
      const layout = computeWireframeLayout(components, 800, 20, 10);
      const tabsNode = layout.nodes[0];
      expect(tabsNode.children![0].astNode.$type).toBe('Button');
    });

    it('should respect Accordion collapsed vs expanded states during layout', async () => {
      const inputExpanded = `wireframe "Expanded Accordion"
accordion "Section A"
  button "Action inside"
end
`;
      await expect(parser.parse(inputExpanded)).resolves.not.toThrow();
      const expLayout = computeWireframeLayout(db.getComponents(), 800, 20, 10);
      expect(expLayout.nodes[0].children).toHaveLength(1);
      const expandedHeight = expLayout.nodes[0].height;

      db.clear();
      const inputCollapsed = `wireframe "Collapsed Accordion"
accordion "Section B" collapsed
  button "Action inside"
end
`;
      await expect(parser.parse(inputCollapsed)).resolves.not.toThrow();
      const colLayout = computeWireframeLayout(db.getComponents(), 800, 20, 10);
      expect(colLayout.nodes[0].children).toBeUndefined();
      expect(colLayout.nodes[0].height).toBeLessThan(expandedHeight);
    });

    it('should track maximum row height when aligning multiple components to prevent downstream overlap', async () => {
      const input = `wireframe "Row Height Align Test"
canvas "Large Image" height=100 id=c1
button "Side Button" alignTo=c1 id=b1
paragraph "Subsequent Text"
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      const layout = computeWireframeLayout(db.getComponents(), 800, 20, 10);
      expect(layout.nodes).toHaveLength(3);

      const canvasNode = layout.nodes[0];
      const buttonNode = layout.nodes[1];
      const paragraphNode = layout.nodes[2];

      expect(buttonNode.y).toBe(canvasNode.y);
      // Paragraph should be placed safely below the bottom of canvas (y=10, height=100 -> bottom=110)
      expect(paragraphNode.y).toBeGreaterThanOrEqual(122);
    });

    it('should respect custom gapX, gapY, and containerPadding config overrides', async () => {
      const input = `wireframe "Config Overrides Test"
button "B1" id=b1
button "B2" alignTo=b1 id=b2
button "B3"
`;
      await expect(parser.parse(input)).resolves.not.toThrow();
      const components = db.getComponents();

      // Custom config: gapX = 30, gapY = 24
      const customLayout = computeWireframeLayout(components, 800, 20, 10, new Map(), {
        gapX: 30,
        gapY: 24,
      });

      const b1 = customLayout.nodes[0];
      const b2 = customLayout.nodes[1];
      const b3 = customLayout.nodes[2];

      expect(b2.x).toBe(b1.x + b1.width + 30);
      expect(b3.y).toBe(b1.y + Math.max(b1.height, b2.height) + 24);
    });

    it('should verify ComponentRegistry fallback for unknown components', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createMockSelection = (): any => ({
        append: () => createMockSelection(),
        attr: () => createMockSelection(),
        style: () => createMockSelection(),
        text: () => createMockSelection(),
      });
      const mockParent = createMockSelection();

      expect(() => {
        registry.render({
          parentElem: mockParent,
          node: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            astNode: { $type: 'CustomUnknownComponent', label: 'Test' } as any,
            x: 0,
            y: 0,
            width: 100,
            height: 30,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          config: {} as any,
          renderChildNodes: () => {
            // No-op for unit test mock
          },
        });
      }).not.toThrow();
    });

    it('should prioritize frontmatter fontFamily and fontSize in styles', () => {
      const originalWireframe = getConfig().wireframe;
      updateSiteConfig({
        wireframe: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 18,
        },
      });

      const generatedStyles = getStyles({
        fontFamily: 'theme-font',
        fontSize: '12px',
      });

      expect(generatedStyles).toContain('font-family: Inter, sans-serif');
      expect(generatedStyles).toContain('font-size: 18px');

      if (originalWireframe) {
        updateSiteConfig({ wireframe: originalWireframe });
      }
    });
  });
});
