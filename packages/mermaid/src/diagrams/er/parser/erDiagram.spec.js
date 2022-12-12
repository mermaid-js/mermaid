import { setConfig } from '../../../config';
import erDb from '../erDb';
import erDiagram from './erDiagram'; // jison file

setConfig({
  securityLevel: 'strict',
});

describe('when parsing ER diagram it...', function () {
  beforeEach(function () {
    erDiagram.parser.yy = erDb;
    erDiagram.parser.yy.clear();
  });

  it('should allow stand-alone entities with no relationships', function () {
    const line1 = 'ISLAND';
    const line2 = 'MAINLAND';
    erDiagram.parser.parse(`erDiagram\n${line1}\n${line2}`);

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(erDb.getRelationships().length).toBe(0);
  });

  describe('entity name', () => {
    it('cannot be empty quotes ""', function () {
      const name = '""';
      expect(() => {
        erDiagram.parser.parse(`erDiagram\n ${name}\n`);
        const entities = erDb.getEntities();
        expect(entities.hasOwnProperty(name)).toBe(false);
      }).toThrow();
    });
    describe('has non A-Za-z0-9_- chars', function () {
      // these were entered using the Mac keyboard utility.
      const chars =
        "~ ` ! @ # $ ^ & * ( ) - _ = + [ ] { } | / ; : ' . ? ¡ ⁄ ™ € £ ‹ ¢ › ∞ ﬁ § ‡ • ° ª · º ‚ ≠ ± œ Œ ∑ „ ® † ˇ ¥ Á ¨ ˆ ˆ Ø π ∏ “ « » å Å ß Í ∂ Î ƒ Ï © ˙ Ó ∆ Ô ˚  ¬ Ò … Ú æ Æ Ω ¸ ≈ π ˛ ç Ç √ ◊ ∫ ı ˜ µ Â ≤ ¯ ≥ ˘ ÷ ¿";
      const allowed = chars.split(' ');

      allowed.forEach((allowedChar) => {
        const singleOccurrence = `Blo${allowedChar}rf`;
        const repeatedOccurrence = `Blo${allowedChar}${allowedChar}rf`;
        const cannontStartWith = `${allowedChar}Blorf`;
        const endsWith = `Blorf${allowedChar}`;

        it(`${singleOccurrence} fails if not surrounded by quotes`, function () {
          const name = singleOccurrence;
          expect(() => {
            erDiagram.parser.parse(`erDiagram\n ${name}\n`);
            const entities = erDb.getEntities();
            expect(entities.hasOwnProperty(name)).toBe(false);
          }).toThrow();
        });

        it(`"${singleOccurrence}" single occurrence`, function () {
          const name = singleOccurrence;
          erDiagram.parser.parse(`erDiagram\n "${name}"\n`);
          const entities = erDb.getEntities();
          expect(entities.hasOwnProperty(name)).toBe(true);
        });

        it(`"${repeatedOccurrence}" repeated occurrence`, function () {
          const name = repeatedOccurrence;
          erDiagram.parser.parse(`erDiagram\n "${name}"\n`);
          const entities = erDb.getEntities();
          expect(entities.hasOwnProperty(name)).toBe(true);
        });

        it(`"${singleOccurrence}" ends with`, function () {
          const name = endsWith;
          erDiagram.parser.parse(`erDiagram\n "${name}"\n`);
          const entities = erDb.getEntities();
          expect(entities.hasOwnProperty(name)).toBe(true);
        });

        it(`"${cannontStartWith}" cannot start with the character`, function () {
          const name = repeatedOccurrence;
          expect(() => {
            erDiagram.parser.parse(`erDiagram\n "${name}"\n`);
            const entities = erDb.getEntities();
            expect(entities.hasOwnProperty(name)).toBe(false);
          }).toThrow();
        });
      });

      const allCombined = allowed.join('');

      it(`a${allCombined} (all non-alphanumerics) in one, starting with 'a'`, function () {
        const name = 'a' + allCombined;
        erDiagram.parser.parse(`erDiagram\n "${name}"\n`);
        const entities = erDb.getEntities();
        expect(entities.hasOwnProperty(name)).toBe(true);
      });
    });

    it('cannot contain % because it interfers with parsing comments', function () {
      expect(() => {
        erDiagram.parser.parse(`erDiagram\n "Blo%rf"\n`);
        const entities = erDb.getEntities();
        expect(entities.hasOwnProperty(name)).toBe(false);
      }).toThrow();
    });
    it('cannot contain \\ because it could start and escape code', function () {
      expect(() => {
        erDiagram.parser.parse(`erDiagram\n "Blo\\rf"\n`);
        const entities = erDb.getEntities();
        expect(entities.hasOwnProperty(name)).toBe(false);
      }).toThrow();
    });

    it('cannot newline, backspace, or vertical characters', function () {
      const disallowed = ['\n', '\r', '\b', '\v'];
      disallowed.forEach((badChar) => {
        const badName = `Blo${badChar}rf`;
        expect(() => {
          erDiagram.parser.parse(`erDiagram\n "${badName}"\n`);
          const entities = erDb.getEntities();
          expect(entities.hasOwnProperty(badName)).toBe(false);
        }).toThrow();
      });
    });

    // skip this: jison cannot handle non-english letters
    it.skip('[skipped test] can contain àáâäæãåā', function () {
      const beyondEnglishName = 'DUCK-àáâäæãåā';
      erDiagram.parser.parse(`erDiagram\n${beyondEnglishName}\n`);
      const entities = erDb.getEntities();
      expect(entities.hasOwnProperty(beyondEnglishName)).toBe(true);
    });

    it('can contain - _ without needing ""', function () {
      const hyphensUnderscore = 'DUCK-BILLED_PLATYPUS';
      erDiagram.parser.parse(`erDiagram\n${hyphensUnderscore}\n`);
      const entities = erDb.getEntities();
      expect(entities.hasOwnProperty(hyphensUnderscore)).toBe(true);
    });
  });

  it('should allow an entity with a single attribute to be defined', function () {
    const entity = 'BOOK';
    const attribute = 'string title';

    erDiagram.parser.parse(`erDiagram\n${entity} {\n${attribute}\n}`);
    const entities = erDb.getEntities();
    expect(Object.keys(entities).length).toBe(1);
    expect(entities[entity].attributes.length).toBe(1);
  });

  it('should allow an entity with a single attribute to be defined with a key', function () {
    const entity = 'BOOK';
    const attribute = 'string title PK';

    erDiagram.parser.parse(`erDiagram\n${entity} {\n${attribute}\n}`);
    const entities = erDb.getEntities();
    expect(Object.keys(entities).length).toBe(1);
    expect(entities[entity].attributes.length).toBe(1);
  });

  it('should allow an entity with a single attribute to be defined with a comment', function () {
    const entity = 'BOOK';
    const attribute = `string title "comment"`;

    erDiagram.parser.parse(`erDiagram\n${entity} {\n${attribute}\n}`);
    const entities = erDb.getEntities();
    expect(Object.keys(entities).length).toBe(1);
    expect(entities[entity].attributes.length).toBe(1);
    expect(entities[entity].attributes[0].attributeComment).toBe('comment');
  });

  it('should allow an entity with a single attribute to be defined with a key and a comment', function () {
    const entity = 'BOOK';
    const attribute = `string title PK "comment"`;

    erDiagram.parser.parse(`erDiagram\n${entity} {\n${attribute}\n}`);
    const entities = erDb.getEntities();
    expect(Object.keys(entities).length).toBe(1);
    expect(entities[entity].attributes.length).toBe(1);
  });

  it('should allow an entity with attribute starting with fk or pk and a comment', function () {
    const entity = 'BOOK';
    const attribute1 = 'int fk_title FK';
    const attribute2 = 'string pk_author PK';
    const attribute3 = 'float pk_price PK "comment"';

    erDiagram.parser.parse(
      `erDiagram\n${entity} {\n${attribute1} \n\n${attribute2}\n${attribute3}\n}`
    );
    const entities = erDb.getEntities();
    expect(entities[entity].attributes.length).toBe(3);
  });

  it('should allow an entity with attribute that has a generic type', function () {
    const entity = 'BOOK';
    const attribute1 = 'type~T~ type';
    const attribute2 = 'option~T~ readable "comment"';
    const attribute3 = 'string id PK';

    erDiagram.parser.parse(
      `erDiagram\n${entity} {\n${attribute1}\n${attribute2}\n${attribute3}\n}`
    );
    const entities = erDb.getEntities();
    expect(Object.keys(entities).length).toBe(1);
    expect(entities[entity].attributes.length).toBe(3);
  });

  it('should allow an entity with attribute that is an array', function () {
    const entity = 'BOOK';
    const attribute1 = 'string[] readers FK "comment"';
    const attribute2 = 'string[] authors FK';

    erDiagram.parser.parse(`erDiagram\n${entity} {\n${attribute1}\n${attribute2}\n}`);
    const entities = erDb.getEntities();
    expect(Object.keys(entities).length).toBe(1);
    expect(entities[entity].attributes.length).toBe(2);
  });

  it('should allow an entity with attribute that is a limited length string', function () {
    const entity = 'BOOK';
    const attribute1 = 'character(10) isbn FK';
    const attribute2 = 'varchar(5) postal_code "Five digits"';

    erDiagram.parser.parse(`erDiagram\n${entity} {\n${attribute1}\n${attribute2}\n}`);
    const entities = erDb.getEntities();
    expect(Object.keys(entities).length).toBe(1);
    expect(entities[entity].attributes.length).toBe(2);
    expect(entities[entity].attributes[0].attributeType).toBe('character(10)');
    expect(entities[entity].attributes[1].attributeType).toBe('varchar(5)');
  });

  it('should allow an entity with multiple attributes to be defined', function () {
    const entity = 'BOOK';
    const attribute1 = 'string title';
    const attribute2 = 'string author';
    const attribute3 = 'float price';

    erDiagram.parser.parse(
      `erDiagram\n${entity} {\n${attribute1}\n${attribute2}\n${attribute3}\n}`
    );
    const entities = erDb.getEntities();
    expect(entities[entity].attributes.length).toBe(3);
  });

  it('should allow attribute definitions to be split into multiple blocks', function () {
    const entity = 'BOOK';
    const attribute1 = 'string title';
    const attribute2 = 'string author';
    const attribute3 = 'float price';

    erDiagram.parser.parse(
      `erDiagram\n${entity} {\n${attribute1}\n}\n${entity} {\n${attribute2}\n${attribute3}\n}`
    );
    const entities = erDb.getEntities();
    expect(entities[entity].attributes.length).toBe(3);
  });

  it('should allow an empty attribute block', function () {
    const entity = 'BOOK';

    erDiagram.parser.parse(`erDiagram\n${entity} {}`);
    const entities = erDb.getEntities();
    expect(entities.hasOwnProperty('BOOK')).toBe(true);
    expect(entities[entity].attributes.length).toBe(0);
  });

  it('should allow an attribute block to start immediately after the entity name', function () {
    const entity = 'BOOK';

    erDiagram.parser.parse(`erDiagram\n${entity}{}`);
    const entities = erDb.getEntities();
    expect(entities.hasOwnProperty('BOOK')).toBe(true);
    expect(entities[entity].attributes.length).toBe(0);
  });

  it('should allow an attribute block to be separated from the entity name by spaces', function () {
    const entity = 'BOOK';

    erDiagram.parser.parse(`erDiagram\n${entity}         {}`);
    const entities = erDb.getEntities();
    expect(entities.hasOwnProperty('BOOK')).toBe(true);
    expect(entities[entity].attributes.length).toBe(0);
  });

  it('should allow whitespace before and after attribute definitions', function () {
    const entity = 'BOOK';
    const attribute = 'string title';

    erDiagram.parser.parse(`erDiagram\n${entity} {\n  \n\n  ${attribute}\n\n  \n}`);
    const entities = erDb.getEntities();
    expect(Object.keys(entities).length).toBe(1);
    expect(entities[entity].attributes.length).toBe(1);
  });

  it('should allow no whitespace before and after attribute definitions', function () {
    const entity = 'BOOK';
    const attribute = 'string title';

    erDiagram.parser.parse(`erDiagram\n${entity}{${attribute}}`);
    const entities = erDb.getEntities();
    expect(Object.keys(entities).length).toBe(1);
    expect(entities[entity].attributes.length).toBe(1);
  });

  it('should associate two entities correctly', function () {
    erDiagram.parser.parse('erDiagram\nCAR ||--o{ DRIVER : "insured for"');
    const entities = erDb.getEntities();
    const relationships = erDb.getRelationships();

    expect(entities.hasOwnProperty('CAR')).toBe(true);
    expect(entities.hasOwnProperty('DRIVER')).toBe(true);
    expect(relationships.length).toBe(1);
    expect(relationships[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_MORE);
    expect(relationships[0].relSpec.cardB).toBe(erDb.Cardinality.ONLY_ONE);
    expect(relationships[0].relSpec.relType).toBe(erDb.Identification.IDENTIFYING);
  });

  it('should not create duplicate entities', function () {
    const line1 = 'CAR ||--o{ DRIVER : "insured for"';
    const line2 = 'DRIVER ||--|| LICENSE : has';
    erDiagram.parser.parse(`erDiagram\n${line1}\n${line2}`);
    const entities = erDb.getEntities();

    expect(Object.keys(entities).length).toBe(3);
  });

  it('should create the role specified', function () {
    const teacherRole = 'is teacher of';
    const line1 = `TEACHER }o--o{ STUDENT : "${teacherRole}"`;
    erDiagram.parser.parse(`erDiagram\n${line1}`);
    const rels = erDb.getRelationships();

    expect(rels[0].roleA).toBe(`${teacherRole}`);
  });

  it('should allow recursive relationships', function () {
    erDiagram.parser.parse('erDiagram\nNODE ||--o{ NODE : "leads to"');
    expect(Object.keys(erDb.getEntities()).length).toBe(1);
  });

  it('should allow for a accessibility title and description (accDescr)', function () {
    const teacherRole = 'is teacher of';
    const line1 = `TEACHER }o--o{ STUDENT : "${teacherRole}"`;

    erDiagram.parser.parse(
      `erDiagram
      accTitle: graph title
      accDescr: this graph is about stuff
      ${line1}`
    );
    expect(erDb.getAccTitle()).toBe('graph title');
    expect(erDb.getAccDescription()).toBe('this graph is about stuff');
  });

  it('should allow for a accessibility title and multi line description (accDescr)', function () {
    const teacherRole = 'is teacher of';
    const line1 = `TEACHER }o--o{ STUDENT : "${teacherRole}"`;

    erDiagram.parser.parse(
      `erDiagram
      accTitle: graph title
      accDescr {
        this graph is about stuff
      }\n
      ${line1}`
    );
    expect(erDb.getAccTitle()).toBe('graph title');
    expect(erDb.getAccDescription()).toBe('this graph is about stuff');
  });

  it('should allow more than one relationship between the same two entities', function () {
    const line1 = 'CAR ||--o{ PERSON : "insured for"';
    const line2 = 'CAR }o--|| PERSON : "owned by"';
    erDiagram.parser.parse(`erDiagram\n${line1}\n${line2}`);
    const entities = erDb.getEntities();
    const rels = erDb.getRelationships();

    expect(Object.keys(entities).length).toBe(2);
    expect(rels.length).toBe(2);
  });

  it('should limit the number of relationships between the same two entities', function () {
    /* TODO */
  });

  it('should not allow multiple relationships between the same two entities unless the roles are different', function () {
    /* TODO */
  });

  it('should handle only-one-to-one-or-more relationships', function () {
    erDiagram.parser.parse('erDiagram\nA ||--|{ B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONE_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ONLY_ONE);
  });

  it('should handle only-one-to-zero-or-more relationships', function () {
    erDiagram.parser.parse('erDiagram\nA ||..o{ B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ONLY_ONE);
  });

  it('should handle zero-or-one-to-zero-or-more relationships', function () {
    erDiagram.parser.parse('erDiagram\nA |o..o{ B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_ONE);
  });

  it('should handle zero-or-one-to-one-or-more relationships', function () {
    erDiagram.parser.parse('erDiagram\nA |o--|{ B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONE_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_ONE);
  });

  it('should handle one-or-more-to-only-one relationships', function () {
    erDiagram.parser.parse('erDiagram\nA }|--|| B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONLY_ONE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ONE_OR_MORE);
  });

  it('should handle zero-or-more-to-only-one relationships', function () {
    erDiagram.parser.parse('erDiagram\nA }o--|| B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONLY_ONE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_MORE);
  });

  it('should handle zero-or-more-to-zero-or-one relationships', function () {
    erDiagram.parser.parse('erDiagram\nA }o..o| B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_ONE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_MORE);
  });

  it('should handle one-or-more-to-zero-or-one relationships', function () {
    erDiagram.parser.parse('erDiagram\nA }|..o| B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_ONE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ONE_OR_MORE);
  });

  it('should handle zero-or-one-to-only-one relationships', function () {
    erDiagram.parser.parse('erDiagram\nA |o..|| B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONLY_ONE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_ONE);
  });

  it('should handle only-one-to-only-one relationships', function () {
    erDiagram.parser.parse('erDiagram\nA ||..|| B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONLY_ONE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ONLY_ONE);
  });

  it('should handle only-one-to-zero-or-one relationships', function () {
    erDiagram.parser.parse('erDiagram\nA ||--o| B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_ONE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ONLY_ONE);
  });

  it('should handle zero-or-one-to-zero-or-one relationships', function () {
    erDiagram.parser.parse('erDiagram\nA |o..o| B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_ONE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_ONE);
  });

  it('should handle zero-or-more-to-zero-or-more relationships', function () {
    erDiagram.parser.parse('erDiagram\nA }o--o{ B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_MORE);
  });

  it('should handle one-or-more-to-one-or-more relationships', function () {
    erDiagram.parser.parse('erDiagram\nA }|..|{ B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONE_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ONE_OR_MORE);
  });

  it('should handle zero-or-more-to-one-or-more relationships', function () {
    erDiagram.parser.parse('erDiagram\nA }o--|{ B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONE_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_MORE);
  });

  it('should handle one-or-more-to-zero-or-more relationships', function () {
    erDiagram.parser.parse('erDiagram\nA }|..o{ B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ONE_OR_MORE);
  });

  it('should handle zero-or-one-to-zero-or-more relationships (aliases "one or zero" and "zero or many")', function () {
    erDiagram.parser.parse('erDiagram\nA one or zero to many B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_ONE);
  });

  it('should handle one-or-more-to-zero-or-one relationships (aliases "one or many" and "zero or one")', function () {
    erDiagram.parser.parse('erDiagram\nA one or many optionally to zero or one B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_ONE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ONE_OR_MORE);
  });

  it('should handle zero-or-more-to-zero-or-more relationships (aliases "zero or more" and "zero or many")', function () {
    erDiagram.parser.parse('erDiagram\nA zero or more to zero or many B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ZERO_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_MORE);
  });

  it('should handle zero-or-more-to-one-or-more relationships (aliases "many(0)" and "many(1)")', function () {
    erDiagram.parser.parse('erDiagram\nA many(0) to many(1) B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONE_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_MORE);
  });

  it('should handle zero-or-more-to-only-one relationships (aliases "many(0)" and "many(1)")', function () {
    erDiagram.parser.parse('erDiagram\nA many optionally to one B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONLY_ONE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_MORE);
  });

  it('should handle only-one-to-only-one relationships (aliases "only one" and  "1+")', function () {
    erDiagram.parser.parse('erDiagram\nA only one optionally to 1+ B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONE_OR_MORE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ONLY_ONE);
  });

  it('should handle zero-or-more-to-only-one relationships (aliases "0+" and  "1")', function () {
    erDiagram.parser.parse('erDiagram\nA 0+ optionally to 1 B : has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].relSpec.cardA).toBe(erDb.Cardinality.ONLY_ONE);
    expect(rels[0].relSpec.cardB).toBe(erDb.Cardinality.ZERO_OR_MORE);
  });

  it('should represent identifying relationships properly', function () {
    erDiagram.parser.parse('erDiagram\nHOUSE ||--|{ ROOM : contains');
    const rels = erDb.getRelationships();
    expect(rels[0].relSpec.relType).toBe(erDb.Identification.IDENTIFYING);
  });

  it('should represent identifying relationships properly (alias "to")', function () {
    erDiagram.parser.parse('erDiagram\nHOUSE one to one ROOM : contains');
    const rels = erDb.getRelationships();
    expect(rels[0].relSpec.relType).toBe(erDb.Identification.IDENTIFYING);
  });

  it('should represent non-identifying relationships properly', function () {
    erDiagram.parser.parse('erDiagram\n PERSON ||..o{ POSSESSION : owns');
    const rels = erDb.getRelationships();
    expect(rels[0].relSpec.relType).toBe(erDb.Identification.NON_IDENTIFYING);
  });

  it('should represent non-identifying relationships properly (alias "optionally to")', function () {
    erDiagram.parser.parse('erDiagram\n PERSON many optionally to many POSSESSION : owns');
    const rels = erDb.getRelationships();
    expect(rels[0].relSpec.relType).toBe(erDb.Identification.NON_IDENTIFYING);
  });

  it('should not accept a syntax error', function () {
    const doc = 'erDiagram\nA xxx B : has';
    expect(() => {
      erDiagram.parser.parse(doc);
    }).toThrowError();
  });

  describe('relationship labels', function () {
    it('should allow an empty quoted label', function () {
      erDiagram.parser.parse('erDiagram\nCUSTOMER ||--|{ ORDER : ""');
      const rels = erDb.getRelationships();
      expect(rels[0].roleA).toBe('');
    });

    it('should allow an non-empty quoted label', function () {
      erDiagram.parser.parse('erDiagram\nCUSTOMER ||--|{ ORDER : "places"');
      const rels = erDb.getRelationships();
      expect(rels[0].roleA).toBe('places');
    });

    it('should allow an non-empty unquoted label', function () {
      erDiagram.parser.parse('erDiagram\nCUSTOMER ||--|{ ORDER : places');
      const rels = erDb.getRelationships();
      expect(rels[0].roleA).toBe('places');
    });
  });
});
