import { setConfig } from '../../../config';
import erDb from '../erDb';
import erDiagram from './erDiagram';

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

  it('should allow hyphens and underscores in entity names', function () {
    const line1 = 'DUCK-BILLED-PLATYPUS';
    const line2 = 'CHARACTER_SET';
    erDiagram.parser.parse(`erDiagram\n${line1}\n${line2}`);

    const entities = erDb.getEntities();
    expect(entities.hasOwnProperty('DUCK-BILLED-PLATYPUS')).toBe(true);
    expect(entities.hasOwnProperty('CHARACTER_SET')).toBe(true);
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

  it('should allow for a title and acc description', function () {
    const teacherRole = 'is teacher of';
    const line1 = `TEACHER }o--o{ STUDENT : "${teacherRole}"`;

    erDiagram.parser.parse(
      `erDiagram\ntitle graph title\n accDescription this graph is about stuff\n${line1}`
    );
    expect(erDb.getTitle()).toBe('graph title');
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

  it('should represent identifying relationships properly', function () {
    erDiagram.parser.parse('erDiagram\nHOUSE ||--|{ ROOM : contains');
    const rels = erDb.getRelationships();
    expect(rels[0].relSpec.relType).toBe(erDb.Identification.IDENTIFYING);
  });

  it('should represent non-identifying relationships properly', function () {
    erDiagram.parser.parse('erDiagram\n PERSON ||..o{ POSSESSION : owns');
    const rels = erDb.getRelationships();
    expect(rels[0].relSpec.relType).toBe(erDb.Identification.NON_IDENTIFYING);
  });

  it('should not accept a syntax error', function () {
    const doc = 'erDiagram\nA xxx B : has';
    expect(() => {
      erDiagram.parser.parse(doc);
    }).toThrowError();
  });

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
