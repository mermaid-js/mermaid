import { ClassMember } from './classTypes.js';
import { vi, describe, it, expect } from 'vitest';
const spyOn = vi.spyOn;

const staticCssStyle = 'text-decoration:underline;';
const abstractCssStyle = 'font-style:italic;';
const abstractStaticCssStyle = 'text-decoration:underline;font-style:italic;';

describe('ClassTypes - Attribute Tests', () => {
  describe('Basic attribute parsing without classifiers', () => {
    it('should parse attribute with no modifiers', () => {
      const str = 'name String';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('name String');
      expect(displayDetails.cssStyle).toBe('');
    });

    it('should parse attribute with public "+" visibility', () => {
      const str = '+name String';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('+name String');
      expect(displayDetails.cssStyle).toBe('');
    });

    it('should parse attribute with protected "#" visibility', () => {
      const str = '#name String';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('#name String');
      expect(displayDetails.cssStyle).toBe('');
    });

    it('should parse attribute with private "-" visibility', () => {
      const str = '-name String';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('-name String');
      expect(displayDetails.cssStyle).toBe('');
    });

    it('should parse attribute with internal "~" visibility', () => {
      const str = '~name String';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('~name String');
      expect(displayDetails.cssStyle).toBe('');
    });

    it('should parse simple attribute name only', () => {
      const str = 'id';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('id');
      expect(displayDetails.cssStyle).toBe('');
    });

    it('should parse attribute with visibility and name only', () => {
      const str = '+id';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('+id');
      expect(displayDetails.cssStyle).toBe('');
    });
  });

  describe('Static classifier ($) attributes', () => {
    it('should parse static attribute without visibility', () => {
      const str = 'count int$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('count int');
      expect(displayDetails.cssStyle).toBe(staticCssStyle);
    });

    it('should parse static attribute with public visibility', () => {
      const str = '+count int$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('+count int');
      expect(displayDetails.cssStyle).toBe(staticCssStyle);
    });

    it('should parse static attribute with protected visibility', () => {
      const str = '#count int$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('#count int');
      expect(displayDetails.cssStyle).toBe(staticCssStyle);
    });

    it('should parse static attribute with private visibility', () => {
      const str = '-count int$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('-count int');
      expect(displayDetails.cssStyle).toBe(staticCssStyle);
    });

    it('should parse static attribute with internal visibility', () => {
      const str = '~count int$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('~count int');
      expect(displayDetails.cssStyle).toBe(staticCssStyle);
    });

    it('should parse static attribute name only', () => {
      const str = 'MAX_SIZE$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('MAX_SIZE');
      expect(displayDetails.cssStyle).toBe(staticCssStyle);
    });
  });

  describe('Abstract classifier (*) attributes', () => {
    it('should parse abstract attribute without visibility', () => {
      const str = 'data String*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('data String');
      expect(displayDetails.cssStyle).toBe(abstractCssStyle);
    });

    it('should parse abstract attribute with public visibility', () => {
      const str = '+data String*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('+data String');
      expect(displayDetails.cssStyle).toBe(abstractCssStyle);
    });

    it('should parse abstract attribute with protected visibility', () => {
      const str = '#data String*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('#data String');
      expect(displayDetails.cssStyle).toBe(abstractCssStyle);
    });

    it('should parse abstract attribute with private visibility', () => {
      const str = '-data String*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('-data String');
      expect(displayDetails.cssStyle).toBe(abstractCssStyle);
    });

    it('should parse abstract attribute with internal visibility', () => {
      const str = '~data String*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('~data String');
      expect(displayDetails.cssStyle).toBe(abstractCssStyle);
    });

    it('should parse abstract attribute name only', () => {
      const str = 'value*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('value');
      expect(displayDetails.cssStyle).toBe(abstractCssStyle);
    });
  });

  describe('Abstract and Static combined classifiers', () => {
    it('should parse abstract+static ($*) attribute without visibility', () => {
      const str = 'config Map$*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('config Map');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse static+abstract (*$) attribute without visibility', () => {
      const str = 'config Map*$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('config Map');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse abstract+static ($*) attribute with public visibility', () => {
      const str = '+config Map$*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('+config Map');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse static+abstract (*$) attribute with public visibility', () => {
      const str = '+config Map*$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('+config Map');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse abstract+static ($*) attribute with protected visibility', () => {
      const str = '#registry HashMap$*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('#registry HashMap');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse static+abstract (*$) attribute with protected visibility', () => {
      const str = '#registry HashMap*$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('#registry HashMap');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse abstract+static ($*) attribute with private visibility', () => {
      const str = '-cache LRUCache$*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('-cache LRUCache');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse static+abstract (*$) attribute with private visibility', () => {
      const str = '-cache LRUCache*$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('-cache LRUCache');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse abstract+static ($*) attribute with internal visibility', () => {
      const str = '~pool ThreadPool$*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('~pool ThreadPool');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse static+abstract (*$) attribute with internal visibility', () => {
      const str = '~pool ThreadPool*$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('~pool ThreadPool');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse abstract+static ($*) attribute name only', () => {
      const str = 'INSTANCE$*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('INSTANCE');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse static+abstract (*$) attribute name only', () => {
      const str = 'INSTANCE*$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('INSTANCE');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });
  });

  describe('Complex attribute type scenarios', () => {
    it('should parse generic type attribute with static classifier', () => {
      const str = '+items List~String~$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('+items List<String>');
      expect(displayDetails.cssStyle).toBe(staticCssStyle);
    });

    it('should parse nested generic type attribute with abstract classifier', () => {
      const str = '#mapping Map~String, List~Integer~~*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('#mapping Map~String, List<Integer~>');
      expect(displayDetails.cssStyle).toBe(abstractCssStyle);
    });

    it('should parse complex generic type with abstract+static classifiers', () => {
      const str = '+factory Function~Map~String, Object~, Promise~Result~~$*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe(
        '+factory Function<Map>String, Object~, Promise<Result~>'
      );
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });

    it('should parse attribute with spaces in type name', () => {
      const str = '+fullName Full Name String$';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('+fullName Full Name String');
      expect(displayDetails.cssStyle).toBe(staticCssStyle);
    });

    it('should parse attribute with special characters in name', () => {
      const str = '+user_name String*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('+user_name String');
      expect(displayDetails.cssStyle).toBe(abstractCssStyle);
    });

    it('should parse attribute with numeric suffix', () => {
      const str = '-value123 int$*';
      const displayDetails = new ClassMember(str, 'attribute').getDisplayDetails();

      expect(displayDetails.displayText).toBe('-value123 int');
      expect(displayDetails.cssStyle).toBe(abstractStaticCssStyle);
    });
  });
});
