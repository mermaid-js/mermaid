import c4Db from '../c4Db.js';
// @ts-ignore: JISON doesn't support types
import c4 from './c4Diagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('parsing C4 relationships', function () {
  beforeEach(function () {
    c4.parser.yy = c4Db;
    c4.parser.yy.clear();
  });

  // A C4Dynamic diagram numbers each interaction, so two calls between the same pair are
  // two interactions rather than a correction of the first (#7183).
  it('keeps every relationship that repeats a from/to pair', function () {
    c4.parser.parse(`C4Dynamic
System(a, "A")
System(b, "B")
Rel(a, b, "Interaction 1")
Rel(a, b, "Interaction 2")`);

    const rels = c4.parser.yy.getRels();
    expect(rels).toHaveLength(2);
    expect(rels.map((rel: { label: { text: string } }) => rel.label.text)).toEqual([
      'Interaction 1',
      'Interaction 2',
    ]);
  });

  it('keeps the two directions of a pair apart', function () {
    c4.parser.parse(`C4Context
Person(a, "A")
System(b, "B")
Rel(a, b, "Uses")
Rel(b, a, "Sends e-mails to")`);

    const rels = c4.parser.yy.getRels();
    expect(rels).toHaveLength(2);
    expect(rels[0]).toMatchObject({ from: 'a', to: 'b' });
    expect(rels[1]).toMatchObject({ from: 'b', to: 'a' });
  });

  // `UpdateRelStyle` names a pair, not one line, so it reaches each relationship between
  // them rather than only whichever was declared first.
  it('applies UpdateRelStyle to every relationship in the named pair', function () {
    c4.parser.parse(`C4Dynamic
System(a, "A")
System(b, "B")
Rel(a, b, "Interaction 1")
Rel(a, b, "Interaction 2")
UpdateRelStyle(a, b, $textColor="blue", $lineColor="blue")`);

    const rels = c4.parser.yy.getRels();
    expect(rels).toHaveLength(2);
    for (const rel of rels) {
      expect(rel).toMatchObject({ textColor: 'blue', lineColor: 'blue' });
    }
  });

  it('still carries the technology and description of each relationship', function () {
    c4.parser.parse(`C4Context
Person(a, "A")
System(b, "B")
Rel(a, b, "Uses", "HTTPS", "to read accounts")`);

    const [rel] = c4.parser.yy.getRels();
    expect(rel.label.text).toBe('Uses');
    expect(rel.techn.text).toBe('HTTPS');
    expect(rel.descr.text).toBe('to read accounts');
  });
});
