import { afterAll, beforeAll, it, describe, expect } from 'vitest';

import { db } from './db.js';
import { parser } from './parser.js';
import { mermaidAPI } from '../../mermaidAPI.js';
import { getConfig } from '../../config.js';
import { contrastRatio } from '../../rendering-util/rendering-elements/edgeStepAnimation.js';

const { clear } = db;
const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 100, height: 20 }),
  });
});

afterAll(() => {
  if (originalGetBBox) {
    Object.defineProperty(SVGElement.prototype, 'getBBox', originalGetBBox);
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getBBox');
  }
});

describe('eventmodeling diagrams', () => {
  beforeEach(() => {
    clear();
  });

  it('should handle a simple eventmodeling definition', async () => {
    const str = `eventmodeling
    tf 01 ui UI
    tf 02 cmd RunAction
    tf 03 evt ActionExecuted`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle data inline in frames', async () => {
    const str = `eventmodeling
    tf 01 cmd AddItem { productId: 7 }
    tf 02 evt ItemAdded { productId: 7 }`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle data block references', async () => {
    const str = `eventmodeling
    tf 01 cmd AddItem
    tf 02 evt ItemAdded [[ItemAddedData]]

data ItemAddedData
{
  productId: 7
}`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle qualified names', async () => {
    const str = `eventmodeling
    tf 01 ui CartUI
    tf 02 cmd Inventory.AddItem
    tf 03 evt Inventory.ItemAdded`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle multiple source frames', async () => {
    const str = `eventmodeling
    tf 01 ui CartUI
    tf 02 cmd AddItem
    tf 03 cmd RemoveItem
    tf 04 evt ItemChanged ->> 02 ->> 03`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle reset frames', async () => {
    const str = `eventmodeling
    rf 01 ui CartUI
    rf 02 cmd AddItem
    rf 03 evt ItemAdded`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should reject a frame id reused by a reset frame', async () => {
    await parser.parse(`eventmodeling
      tf 09 ui PreviousDiagram`);

    await expect(
      parser.parse(`eventmodeling
        tf 01 ui UI
        tf 02 cmd Command
        rf 01 evt Event`)
    ).rejects.toThrow('Duplicate event modeling frame ID "01" on line 4');
    expect(() => db.getState()).toThrow('No data for EventModel');
  });

  it('should report the original line number when comments precede a duplicate frame', async () => {
    await expect(
      mermaidAPI.parse(`eventmodeling
        tf 01 ui UI
        %% This comment occupies a source line.
        rf 01 evt Event`)
    ).rejects.toThrow('Duplicate event modeling frame ID "01" on line 4');
  });

  it('should keep explicit sources on a reset frame without inferring the previous frame', async () => {
    await parser.parse(`eventmodeling
      tf 01 ui UI
      tf 02 cmd Command
      tf 03 evt Event
      rf 04 rmo ReadModel ->> 03
      rf 05 ui OtherUI`);

    const relations = db
      .getState()
      .relations.map(({ sourceBox, targetBox }) => [sourceBox.frame.name, targetBox.frame.name]);
    expect(relations).toContainEqual(['03', '04']);
    expect(relations).not.toContainEqual(['04', '05']);
  });

  it('should handle all entity types', async () => {
    const str = `eventmodeling
    tf 01 ui UI
    tf 02 ui UI2
    tf 03 cmd Command
    tf 04 command Command2
    tf 05 evt Event
    tf 06 event Event2
    tf 07 pcr Processor
    tf 08 processor Processor2
    tf 09 rmo ReadModel
    tf 10 readmodel ReadModel2`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });
});

describe('eventmodeling rendering', () => {
  afterAll(() => {
    mermaidAPI.initialize({ theme: 'default' });
  });

  it('should render the text of a box with the text color of the theme', async () => {
    mermaidAPI.initialize({ theme: 'dark' });
    const { svg } = await mermaidAPI.render(
      'eventmodeling-dark',
      `eventmodeling
    tf 01 ui CartUI`
    );
    const box = new DOMParser().parseFromString(svg, 'text/html').querySelector('.em-box span');
    const expected = document.createElement('span');
    expected.style.color = getConfig().themeVariables.textColor;
    expect((box as HTMLElement).style.color).toBe(expected.style.color);
  });

  it.each(['dark', 'neo-dark', 'redux-dark', 'redux-dark-color'] as const)(
    'should keep the text of every box readable with the %s theme',
    async (theme) => {
      mermaidAPI.initialize({ theme });
      const { svg } = await mermaidAPI.render(
        `eventmodeling-${theme}`,
        `eventmodeling
    tf 01 ui Screen
    tf 02 cmd Command
    tf 03 evt Event
    tf 04 rmo Model
    tf 05 pcr Processor`
      );
      const rects = new DOMParser()
        .parseFromString(svg, 'text/html')
        .querySelectorAll('.em-box rect');
      const fills = [...rects].map((rect) => rect.getAttribute('fill')!);
      const { textColor } = getConfig().themeVariables;
      expect(fills).toHaveLength(5);
      for (const fill of fills) {
        expect(contrastRatio(textColor, fill)).toBeGreaterThanOrEqual(4.5);
      }
    }
  );
});
