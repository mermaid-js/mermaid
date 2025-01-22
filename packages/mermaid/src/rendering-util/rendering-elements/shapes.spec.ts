import { describe, it, expect } from 'vitest';
import { shapes, isValidShape, type ShapeID, shapesDefs } from './shapes.js';

describe('shapes', () => {
  it('should have a valid shape handler for each shape', () => {
    Object.keys(shapes).forEach((shape) => {
      expect(typeof shapes[shape as ShapeID]).toBe('function');
    });
  });

  it('should return true for valid shape IDs', () => {
    const validShapes: ShapeID[] = Object.keys(shapes) as ShapeID[];
    validShapes.forEach((shape) => {
      expect(isValidShape(shape)).toBe(true);
    });
  });

  it('should return false for invalid shape IDs', () => {
    const invalidShapes = ['invalidShape1', 'invalidShape2', 'invalidShape3'];
    invalidShapes.forEach((shape) => {
      expect(isValidShape(shape)).toBe(false);
    });
  });

  /*
  it('should have unique short names and aliases', () => {
    const allNames = new Set<string>();
    shapesDefs.forEach((shape) => {
      const names = [shape.shortName, ...(shape.aliases ?? []), ...(shape.internalAliases ?? [])];
      names.forEach((name) => {
        expect(allNames.has(name)).toBe(false);
        allNames.add(name);
      });
    });
  });
  */

  it('should have a handler for each shape definition', () => {
    shapesDefs.forEach((shape) => {
      expect(typeof shape.handler).toBe('function');
    });
  });

  it('should have a semantic name, name, short name, and description for each shape definition', () => {
    shapesDefs.forEach((shape) => {
      expect(typeof shape.semanticName).toBe('string');
      expect(typeof shape.name).toBe('string');
      expect(typeof shape.shortName).toBe('string');
      expect(typeof shape.description).toBe('string');
    });
  });
});
