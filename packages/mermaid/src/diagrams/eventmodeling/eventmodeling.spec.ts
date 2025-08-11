import { it, describe, expect } from 'vitest';

// import { Diagram } from '../../Diagram.js';
// import mermaidAPI from '../../mermaidAPI.js';

import { db } from './db.js';
import { parser } from './parser.js';

const { clear } = db;

const fixtureStateView = `eventmodeling


tf 01 scn CartScreen
tf 02 cmd AddItem
tf 03 evt ItemAdded
`;

const fixtureStateChange = `eventmodeling

tf 03 evt ItemAdded
tf 02 rmo CartItems
tf 04 scn CartScreen
`;

const fixtureTranslation = `eventmodeling

tf 03 evt External.InventoryChanged
tf 02 pcr InventoryProcessor
tf 04 cmd ChangeInventory
tf 05 evt Cart.InventoryChanged
`;

const fixtureMultipleRelations = `eventmodeling


rf 02 evt CartCreated
rf 03 evt ItemAdded
rf 04 evt ItemRemoved
rf 05 evt CartCleared
tf 01 rmo CartScreen >f 02 >f 03 >f 04 >f 05
`;

describe('eventmodeling diagrams', () => {
  beforeEach(() => {
    clear();
  });

  it('should handle a simple eventmodeling definition', async () => {
    const str = `eventmodeling
    tf 01 scn Screen
    tf 02 cmd RunAction
    tf 03 evt ActionExecuted`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should produce correct store state for State View', async () => {
    await parser.parse(fixtureStateView);
    const state = db.getState();

    expect(state.boxes.length).toBe(3);
    expect(state.sortedSwimlanesArray.length).toBe(3);
    expect(state.relations.length).toBe(2);
  });

  it('should produce correct store state for State Change', async () => {
    await parser.parse(fixtureStateChange);
    const state = db.getState();

    expect(state.boxes.length).toBe(3);
    expect(state.sortedSwimlanesArray.length).toBe(3);
    expect(state.relations.length).toBe(2);
  });

  it('should produce correct store state for Translation', async () => {
    await parser.parse(fixtureTranslation);
    const state = db.getState();

    // console.log(state);
    expect(state.boxes.length).toBe(4);
    expect(state.sortedSwimlanesArray.length).toBe(4);
    expect(state.relations.length).toBe(3);
  });

  it('should produce correct store state for Multiple relations', async () => {
    await parser.parse(fixtureMultipleRelations);
    const state = db.getState();

    // console.log(state);
    expect(state.boxes.length).toBe(5);
    expect(state.sortedSwimlanesArray.length).toBe(2);
    expect(state.relations.length).toBe(4);
  });

  // fails because it reports `html` method not found for D3 div element. That's weird as it works outside of tests

  // describe('draw', () => {
  //   it('should draw a simple eventmodeling diagram', async () => {
  //     const str = `eventmodeling
  //     tf 01 scn Screen
  //     tf 02 cmd RunAction
  //     tf 03 evt ActionExecuted`;
  //     await mermaidAPI.parse(str);
  //     const diagram = await Diagram.fromText(str);
  //     await diagram.renderer.draw(str, 'tst', '1.2.3', diagram);
  //   });
  // });
});
