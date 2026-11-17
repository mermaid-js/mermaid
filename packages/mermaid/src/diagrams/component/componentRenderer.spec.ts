import { describe, expect, it } from 'vitest';
import {
  getComponentBoundaryAccessibleName,
  getComponentEdgeAccessibleName,
  getComponentNodeAccessibleName,
} from './componentRenderer.js';
import type {
  ComponentLayoutCluster,
  ComponentLayoutEdge,
  ComponentLayoutNode,
} from './componentTypes.js';

const node = (overrides: Partial<ComponentLayoutNode>): ComponentLayoutNode =>
  ({
    id: 'A',
    label: 'A',
    labelType: 'text',
    shape: 'umlComponent',
    isGroup: false,
    ...overrides,
  }) as ComponentLayoutNode;

describe('component accessible names', () => {
  it('names a plain component', () => {
    expect(getComponentNodeAccessibleName(node({ label: 'Orders' }))).toBe('component Orders');
  });

  it('includes the stereotype', () => {
    expect(getComponentNodeAccessibleName(node({ label: 'Orders', stereotype: 'service' }))).toBe(
      'component Orders, stereotype service'
    );
  });

  it('names an interface', () => {
    expect(getComponentNodeAccessibleName(node({ label: 'IOrders', shape: 'umlInterface' }))).toBe(
      'interface IOrders'
    );
  });

  it('names a port', () => {
    expect(getComponentNodeAccessibleName(node({ label: 'api', shape: 'umlPort' }))).toBe(
      'port api'
    );
  });

  it('names an actor with its stereotype', () => {
    expect(
      getComponentNodeAccessibleName(
        node({ label: 'Bank', shape: 'usecaseActor', stereotype: 'external' })
      )
    ).toBe('actor Bank, stereotype external');
  });

  it('names a note by its target', () => {
    expect(
      getComponentNodeAccessibleName(
        node({ label: 'handles checkout', shape: 'note', noteTargetLabel: 'Orders' })
      )
    ).toBe('Note for Orders: handles checkout');
  });

  it('names a package boundary', () => {
    const cluster = {
      id: 'Backend',
      label: 'Backend',
      isGroup: true,
      boundaryType: 'package',
    } as unknown as ComponentLayoutCluster;
    expect(getComponentBoundaryAccessibleName(cluster)).toBe('package Backend');
  });

  it('names a relation edge', () => {
    const edge = {
      relationKind: 'dependency',
      label: 'writes to',
      sourceLabel: 'Payments',
      targetLabel: 'Ledger',
    } as unknown as ComponentLayoutEdge;
    expect(getComponentEdgeAccessibleName(edge)).toBe(
      'dependency writes to from Payments to Ledger'
    );
  });

  it('hides the note connector edge from assistive technology', () => {
    const edge = { relationKind: 'note' } as unknown as ComponentLayoutEdge;
    expect(getComponentEdgeAccessibleName(edge)).toBe('');
  });
});
