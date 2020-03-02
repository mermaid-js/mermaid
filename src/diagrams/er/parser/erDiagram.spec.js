import erDb from '../erDb';
import erDiagram from './erDiagram';
import { setConfig } from '../../../config';
import logger from '../../../logger';

setConfig({
  securityLevel: 'strict'
});

describe('when parsing ER diagram it...', function() {

  beforeEach(function() {
    erDiagram.parser.yy = erDb;
    erDiagram.parser.yy.clear();
  });

  it('should associate two entities correctly', function() {
    erDiagram.parser.parse('erDiagram\nCAR !-?< DRIVER : "insured for", "can drive"');
    const entities = erDb.getEntities();
    const relationships = erDb.getRelationships();
    const carEntity = entities.CAR;
    const driverEntity = entities.DRIVER;

    expect(carEntity).toBe('CAR');
    expect(driverEntity).toBe('DRIVER');
    expect(relationships.length).toBe(1);
    expect(relationships[0].cardinality).toBe(erDb.Cardinality.ONLY_ONE_TO_ZERO_OR_MORE);
  });

  it('should not create duplicate entities', function() {
    const line1 = 'CAR !-?< DRIVER : "insured for", "can drive"';
    const line2 = 'DRIVER !-! LICENSE : has, "belongs to"';
    erDiagram.parser.parse(`erDiagram\n${line1}\n${line2}`);
    const entities = erDb.getEntities();

    expect(Object.keys(entities).length).toBe(3);
  });

  it('should create the roles specified', function() {
    const teacherRole = 'is teacher of';
    const studentRole = 'is student of';
    const line1 = `TEACHER >?-?< STUDENT : "${teacherRole}", "${studentRole}"`;
    erDiagram.parser.parse(`erDiagram\n${line1}`);
    const rels = erDb.getRelationships();

    expect(rels[0].roleA).toBe(`${teacherRole}`);
    expect(rels[0].roleB).toBe(`${studentRole}`);
  });

  it('should allow recursive relationships', function() {
    erDiagram.parser.parse('erDiagram\nNODE !-?< NODE : "leads to", "comes from"');
    expect(Object.keys(erDb.getEntities()).length).toBe(1);
  });

  it('should allow more than one relationship between the same two entities', function() {
    const line1 = 'CAR !-?< PERSON : "insured for", "may drive"';
    const line2 = 'CAR >?-! PERSON : "owned by", "owns"';
    erDiagram.parser.parse(`erDiagram\n${line1}\n${line2}`);
    const entities = erDb.getEntities();
    const rels     = erDb.getRelationships();

    expect(Object.keys(entities).length).toBe(2);
    expect(rels.length).toBe(2);
  });

  it('should limit the number of relationships between the same two entities', function() {
    /* TODO */
  });

  it ('should not allow relationships between the same two entities unless the roles are different', function() {
    /* TODO */
  });

  it('should handle only-one-to-one-or-more relationships', function() {
    erDiagram.parser.parse('erDiagram\nA !-!< B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ONLY_ONE_TO_ONE_OR_MORE);
  });

  it('should handle only-one-to-zero-or-more relationships', function() {
    erDiagram.parser.parse('erDiagram\nA !-?< B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ONLY_ONE_TO_ZERO_OR_MORE);

  });

  it('should handle zero-or-one-to-zero-or-more relationships', function() {
    erDiagram.parser.parse('erDiagram\nA ?-?< B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ZERO_OR_ONE_TO_ZERO_OR_MORE);
  });

  it('should handle zero-or-one-to-one-or-more relationships', function() {
    erDiagram.parser.parse('erDiagram\nA ?-!< B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ZERO_OR_ONE_TO_ONE_OR_MORE);
  });

  it('should handle one-or-more-to-only-one relationships', function() {
    erDiagram.parser.parse('erDiagram\nA >!-! B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ONE_OR_MORE_TO_ONLY_ONE);
  });

  it('should handle zero-or-more-to-only-one relationships', function() {
    erDiagram.parser.parse('erDiagram\nA >?-! B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ZERO_OR_MORE_TO_ONLY_ONE);
  });

  it('should handle zero-or-more-to-zero-or-one relationships', function() {
    erDiagram.parser.parse('erDiagram\nA >?-? B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ZERO_OR_MORE_TO_ZERO_OR_ONE);
  });

  it('should handle one-or-more-to-zero-or-one relationships', function() {
    erDiagram.parser.parse('erDiagram\nA >!-? B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ONE_OR_MORE_TO_ZERO_OR_ONE);
  });

  it('should handle zero-or-one-to-only-one relationships', function() {
    erDiagram.parser.parse('erDiagram\nA ?-! B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ZERO_OR_ONE_TO_ONLY_ONE);
  });

  it('should handle only-one-to-only-one relationships', function() {
    erDiagram.parser.parse('erDiagram\nA !-! B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ONLY_ONE_TO_ONLY_ONE);
  });

  it('should handle only-one-to-zero-or-one relationships', function() {
    erDiagram.parser.parse('erDiagram\nA !-? B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ONLY_ONE_TO_ZERO_OR_ONE);
  });

  it('should handle zero-or-one-to-zero-or-one relationships', function() {
    erDiagram.parser.parse('erDiagram\nA ?-? B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ZERO_OR_ONE_TO_ZERO_OR_ONE);
  });

  it('should handle zero-or-more-to-zero-or-more relationships', function() {
    erDiagram.parser.parse('erDiagram\nA >?-?< B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ZERO_OR_MORE_TO_ZERO_OR_MORE);
  });

  it('should handle one-or-more-to-one-or-more relationships', function() {
    erDiagram.parser.parse('erDiagram\nA >!-!< B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ONE_OR_MORE_TO_ONE_OR_MORE);
  });

  it('should handle zero-or-more-to-one-or-more relationships', function() {
    erDiagram.parser.parse('erDiagram\nA >?-!< B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ZERO_OR_MORE_TO_ONE_OR_MORE);
  });

  it('should handle one-or-more-to-zero-or-more relationships', function() {
    erDiagram.parser.parse('erDiagram\nA >!-?< B : has, has');
    const rels = erDb.getRelationships();

    expect(Object.keys(erDb.getEntities()).length).toBe(2);
    expect(rels.length).toBe(1);
    expect(rels[0].cardinality).toBe(erDb.Cardinality.ONE_OR_MORE_TO_ZERO_OR_MORE);
  });

  it('should not accept a syntax error', function() {
    const doc = 'erDiagram\nA xxx B : has, has';
    expect(() => {
      erDiagram.parser.parse(doc);
    }).toThrowError();
  });

});
