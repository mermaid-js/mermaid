import { describe, expect, it } from 'vitest';
import { RailroadDB } from './db.js';
import { parser } from './parser.js';

describe('railroad diagrams', () => {
  it('should parse railroad-beta metadata and source', async () => {
    const db = new RailroadDB();
    if (parser.parser) {
      parser.parser.yy = db;
    }

    const source = `railroad-beta
title: "Railroad Example"
accTitle: "Railroad accessibility title"
accDescr: "Railroad accessibility description"
query := sequence(textBox("SELECT", "terminal"), textBox("columns", "nonterminal"))`;

    await expect(parser.parse(source)).resolves.not.toThrow();
    expect(db.getDiagramTitle()).toBe('Railroad Example');
    expect(db.getAccTitle()).toBe('Railroad accessibility title');
    expect(db.getAccDescription()).toBe('Railroad accessibility description');
    expect(db.getSource()).toBe(
      'query := sequence(textBox("SELECT", "terminal"), textBox("columns", "nonterminal"))'
    );
  });

  it('should parse railroad without metadata', async () => {
    const db = new RailroadDB();
    if (parser.parser) {
      parser.parser.yy = db;
    }

    await expect(
      parser.parse('railroad\ndigit := textBox("0..9", "terminal")')
    ).resolves.not.toThrow();
    expect(db.getSource()).toBe('digit := textBox("0..9", "terminal")');
  });
});
