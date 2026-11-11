import { beforeEach, describe, expect, it } from 'vitest';
import { defaultConfig, getConfig, reset, setSiteConfig } from './config.js';
import { ClassDB } from './diagrams/class/classDb.js';
// @ts-expect-error Vite's JSON Schema plugin supplies this module during tests.
import schemaDefaults from './schemas/config.schema.yaml?only-defaults=true';

describe('class diagram defaults', () => {
  beforeEach(() => {
    reset();
    setSiteConfig({});
  });

  it('exposes the defaults declared by the class schema', () => {
    expect(defaultConfig.class).toMatchObject(schemaDefaults.class);
    expect(getConfig().class).toMatchObject({
      useMaxWidth: true,
      titleTopMargin: 25,
      arrowMarkerAbsolute: false,
      dividerMargin: 10,
      textHeight: 10,
      htmlLabels: false,
    });
  });

  it('leaves padding to the existing per-shape defaults', () => {
    expect(schemaDefaults.class.padding).toBeUndefined();
    expect(getConfig().class?.padding).toBeUndefined();
    const db = new ClassDB();
    db.addNamespace('shop');
    db.addClass('Order');
    db.addClassesToNamespace('shop', ['Order'], []);
    db.addNote('A note', 'Order');
    const nodes = db.getData().nodes;
    expect(nodes.find((node) => node.id === 'shop')?.padding).toBe(16);
    expect(nodes.find((node) => node.shape === 'note')?.padding).toBe(6);
  });

  it.each([0, 5, 24])('honors explicit class padding %s for namespaces and notes', (padding) => {
    setSiteConfig({ class: { padding } });
    const db = new ClassDB();
    db.addNamespace('shop');
    db.addClass('Order');
    db.addNote('A note', 'Order');
    const nodes = db.getData().nodes;
    expect(nodes.find((node) => node.id === 'shop')?.padding).toBe(padding);
    expect(nodes.find((node) => node.shape === 'note')?.padding).toBe(padding);
  });
});
