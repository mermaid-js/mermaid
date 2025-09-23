import { ErDB } from '../erDb.js';
import erDiagram from './erDiagram.jison';
import { setConfig } from '../../../config.js';
import { vi } from 'vitest';

describe('[Interactions] when parsing ER diagram', () => {
  let erDb;
  
  beforeEach(function () {
    erDb = new ErDB();
    erDiagram.parser.yy = erDb;
    erDiagram.parser.yy.clear();
  });

  describe('Parser integration tests', () => {
    it('should be possible to use click to call a callback', function () {
      const spy = vi.spyOn(erDb, 'setClickEvent');
      erDiagram.parser.parse('erDiagram\nCUSTOMER\nclick CUSTOMER call testCallback');

      expect(spy).toHaveBeenCalledWith('CUSTOMER', 'testCallback');
    });

    it('should be possible to use click to call a callback with arguments', function () {
      const spy = vi.spyOn(erDb, 'setClickEvent');
      erDiagram.parser.parse(
        'erDiagram\nCUSTOMER\nclick CUSTOMER call testCallback(\'arg1\', "arg2")'
      );

      expect(spy).toHaveBeenCalledWith('CUSTOMER', 'testCallback', '\'arg1\', "arg2"');
    });

    it('should be possible to use click to link to an external URL', function () {
      const spy = vi.spyOn(erDb, 'setLink');
      erDiagram.parser.parse('erDiagram\nCUSTOMER\nclick CUSTOMER "http://example.com"');

      expect(spy).toHaveBeenCalledWith('CUSTOMER', 'http://example.com');
    });

    it('should be possible to use click to link to an external URL with target', function () {
      const spy = vi.spyOn(erDb, 'setLink');
      erDiagram.parser.parse('erDiagram\nCUSTOMER\nclick CUSTOMER href "http://example.com" _blank');

      expect(spy).toHaveBeenCalledWith('CUSTOMER', 'http://example.com', '_blank');
    });
  });

  describe('setClickEvent method', () => {
    beforeEach(() => {
      // Add a test entity
      erDb.addEntity('CUSTOMER');
    });

    it('should set haveCallback and clickable class for valid entity', () => {
      setConfig({ securityLevel: 'loose' });
      erDb.setClickEvent('CUSTOMER', 'testCallback');
      
      const entity = erDb.getEntity('CUSTOMER');
      expect(entity.haveCallback).toBe(true);
      expect(entity.cssClasses).toContain('clickable');
    });

    it('should do nothing when entity does not exist', () => {
      setConfig({ securityLevel: 'loose' });
      erDb.setClickEvent('NONEXISTENT', 'testCallback');
      
      // Should not throw and should not create the entity
      expect(erDb.getEntity('NONEXISTENT')).toBeUndefined();
    });

    it('should set haveCallback but not process callback when securityLevel is not loose', () => {
      setConfig({ securityLevel: 'strict' });
      erDb.setClickEvent('CUSTOMER', 'testCallback');
      
      const entity = erDb.getEntity('CUSTOMER');
      expect(entity.haveCallback).toBe(true);
      expect(entity.cssClasses).toContain('clickable');
    });

    it('should set haveCallback but not process callback when functionName is undefined', () => {
      setConfig({ securityLevel: 'loose' });
      erDb.setClickEvent('CUSTOMER', undefined);
      
      const entity = erDb.getEntity('CUSTOMER');
      expect(entity.haveCallback).toBe(true);
    });

    it('should handle callback with function arguments', () => {
      setConfig({ securityLevel: 'loose' });
      erDb.setClickEvent('CUSTOMER', 'testCallback', 'arg1, "arg2", \'arg3\'');
      
      const entity = erDb.getEntity('CUSTOMER');
      expect(entity.haveCallback).toBe(true);
      expect(entity.cssClasses).toContain('clickable');
    });

    it('should handle mixed quotes in arguments', () => {
      setConfig({ securityLevel: 'loose' });
      erDb.setClickEvent('CUSTOMER', 'testCallback', '"quoted arg", unquoted');
      
      const entity = erDb.getEntity('CUSTOMER');
      expect(entity.haveCallback).toBe(true);
      expect(entity.cssClasses).toContain('clickable');
    });

    it('should handle callback without arguments', () => {
      setConfig({ securityLevel: 'loose' });
      erDb.setClickEvent('CUSTOMER', 'testCallback');
      
      const entity = erDb.getEntity('CUSTOMER');
      expect(entity.haveCallback).toBe(true);
      expect(entity.cssClasses).toContain('clickable');
    });

    it('should handle arguments with commas in quoted strings', () => {
      setConfig({ securityLevel: 'loose' });
      erDb.setClickEvent('CUSTOMER', 'testCallback', '"arg with, comma", "another, arg"');
      
      const entity = erDb.getEntity('CUSTOMER');
      expect(entity.haveCallback).toBe(true);
      expect(entity.cssClasses).toContain('clickable');
    });
  });

  describe('setLink method', () => {
    beforeEach(() => {
      erDb.addEntity('CUSTOMER');
    });

    it('should set link and clickable class for valid entity', () => {
      erDb.setLink('CUSTOMER', 'http://example.com');
      
      const entity = erDb.getEntity('CUSTOMER');
      expect(entity.link).toBe('http://example.com');
      expect(entity.cssClasses).toContain('clickable');
    });

    it('should set link with target', () => {
      erDb.setLink('CUSTOMER', 'http://example.com', '_blank');
      
      const entity = erDb.getEntity('CUSTOMER');
      expect(entity.link).toBe('http://example.com');
      expect(entity.linkTarget).toBe('_blank');
      expect(entity.cssClasses).toContain('clickable');
    });

    it('should do nothing when entity does not exist', () => {
      erDb.setLink('NONEXISTENT', 'http://example.com');
      
      expect(erDb.getEntity('NONEXISTENT')).toBeUndefined();
    });
  });

  describe('clear method', () => {
    it('should reset all state', () => {
      setConfig({ securityLevel: 'loose' });
      erDb.addEntity('CUSTOMER');
      erDb.setClickEvent('CUSTOMER', 'testCallback');
      erDb.setLink('CUSTOMER', 'http://example.com');
      
      expect(erDb.getEntities().size).toBeGreaterThan(0);
      
      erDb.clear();
      
      expect(erDb.getEntities().size).toBe(0);
    });
  });

  describe('getData method with interactions', () => {
    it('should include link and haveCallback properties in node data', () => {
      erDb.addEntity('CUSTOMER');
      erDb.addEntity('ORDER');
      erDb.setClickEvent('CUSTOMER', 'testCallback');
      erDb.setLink('ORDER', 'http://example.com', '_blank');
      
      const data = erDb.getData();
      
      const customerNode = data.nodes.find(n => n.label === 'CUSTOMER');
      const orderNode = data.nodes.find(n => n.label === 'ORDER');
      
      expect(customerNode.haveCallback).toBe(true);
      expect(customerNode.cssClasses).toContain('clickable');
      
      expect(orderNode.link).toBe('http://example.com');
      expect(orderNode.linkTarget).toBe('_blank');
      expect(orderNode.cssClasses).toContain('clickable');
    });
  });
});