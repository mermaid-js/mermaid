import { RequirementDB } from './requirementDb.js';
import { describe, it, expect } from 'vitest';
import type { Relation, RelationshipType } from './types.js';

describe('requirementDb', () => {
  const requirementDb = new RequirementDB();
  beforeEach(() => {
    requirementDb.clear();
  });

  it('should add a requirement', () => {
    requirementDb.addRequirement('requirement', 'Requirement');
    const requirements = requirementDb.getRequirements();
    expect(requirements.has('requirement')).toBe(true);
  });

  it('should add an element', () => {
    requirementDb.addElement('element');
    const elements = requirementDb.getElements();
    expect(elements.has('element')).toBe(true);
  });

  it('should add a relationship', () => {
    requirementDb.addRelationship('contains' as RelationshipType, 'src', 'dst');
    const relationships = requirementDb.getRelationships();
    const relationship = relationships.find(
      (r: Relation) => r.type === 'contains' && r.src === 'src' && r.dst === 'dst'
    );
    expect(relationship).toBeDefined();
  });

  it('should detect single class', () => {
    requirementDb.defineClass(['a'], ['stroke-width: 8px']);
    const classes = requirementDb.getClasses();

    expect(classes.has('a')).toBe(true);
    expect(classes.get('a')?.styles).toEqual(['stroke-width: 8px']);
  });

  it('should detect many classes', () => {
    requirementDb.defineClass(['a', 'b'], ['stroke-width: 8px']);
    const classes = requirementDb.getClasses();

    expect(classes.has('a')).toBe(true);
    expect(classes.has('b')).toBe(true);
    expect(classes.get('a')?.styles).toEqual(['stroke-width: 8px']);
    expect(classes.get('b')?.styles).toEqual(['stroke-width: 8px']);
  });

  it('should detect direction', () => {
    requirementDb.setDirection('TB');
    const direction = requirementDb.getDirection();

    expect(direction).toBe('TB');
  });

  it('should add styles to a requirement and element', () => {
    requirementDb.addRequirement('requirement', 'Requirement');
    requirementDb.setCssStyle(['requirement'], ['color:red']);
    requirementDb.addElement('element');
    requirementDb.setCssStyle(['element'], ['stroke-width:4px', 'stroke: yellow']);

    const requirement = requirementDb.getRequirements().get('requirement');
    const element = requirementDb.getElements().get('element');

    expect(requirement?.cssStyles).toEqual(['color:red']);
    expect(element?.cssStyles).toEqual(['stroke-width:4px', 'stroke: yellow']);
  });

  it('should add classes to a requirement and element', () => {
    requirementDb.addRequirement('requirement', 'Requirement');
    requirementDb.addElement('element');
    requirementDb.setClass(['requirement', 'element'], ['myClass']);

    const requirement = requirementDb.getRequirements().get('requirement');
    const element = requirementDb.getElements().get('element');

    expect(requirement?.classes).toEqual(['default', 'myClass']);
    expect(element?.classes).toEqual(['default', 'myClass']);
  });

  it('should add styles to a requirement and element inherited from a class', () => {
    requirementDb.addRequirement('requirement', 'Requirement');
    requirementDb.addElement('element');
    requirementDb.defineClass(['myClass'], ['color:red']);
    requirementDb.defineClass(['myClass2'], ['stroke-width:4px', 'stroke: yellow']);
    requirementDb.setClass(['requirement'], ['myClass']);
    requirementDb.setClass(['element'], ['myClass2']);

    const requirement = requirementDb.getRequirements().get('requirement');
    const element = requirementDb.getElements().get('element');

    expect(requirement?.cssStyles).toEqual(['color:red']);
    expect(element?.cssStyles).toEqual(['stroke-width:4px', 'stroke: yellow']);
  });
});
