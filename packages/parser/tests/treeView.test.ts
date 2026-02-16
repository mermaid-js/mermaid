import { describe, expect, it } from 'vitest';
import { expectNoErrorsOrAlternatives } from './test-util.js';
import type { TreeView, TreeNode } from '../src/language/generated/ast.js';
import type { LangiumParser } from 'langium';
import { createTreeViewServices } from '../src/language/treeView/module.js';


describe('TreeView Parser', () => {
  const services = createTreeViewServices().TreeView;
  const parser: LangiumParser = services.parser.LangiumParser;

  const parse = (input: string) => {
    return parser.parse<TreeView>(input);
  };

  describe('Basic Parsing', () => {
    it('should parse empty treeView', () => {
      const result = parse('treeView-beta\naccDescr:  foo\naccTitle: bar \ntitle yeah man\n0 thing\n2 other');
      //const result = parse('treeView-beta\naccDescr:  foo\naccTitle: bar\ntitle yeah man\nthing\n');

expect(result.parserErrors.length).toBe(0);
      //expect(result.parserErrors[0]).toBe("foo-error")

//      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
       
      
      // expect(result.value.nodes[0].$type).toBe("TreeNode");
      //   expect(result.value.nodes[0].name).toBe("thing");
    
    
        expect(result.value.accDescr).toBe("foo");
        expect(result.value.accTitle).toBe("bar");
        expect(result.value.title).toBe("yeah man");
        expect(result.value.nodes.length).toBe(2)

        // expect(result.value.nodes.length).toBe(2);
        expect(result.value.nodes[0].name).toBe("thing");
        expect(result.value.nodes[1].name).toBe("other");
  
  });
});

});
// describe('treeView', () => {
//   describe('Parsing with Accessibility Titles and Descriptions', () => {
//     it('should parse accessibility titles', () => {
//       const result = parse(`treeView-beta\naccDescr:desc\ndocs\n\tbuild\n\tmake.bat`)
//       //const result = parse(`treeView-beta\n  accTitle: Accessible Graph\n  item\n`);
//       expect(result.value.$type).toBe('TreeView');
//       //expect(result.value.nodes.length).toBe(7);

//       expect(result.value.accDescr).toBe('Accessible Graph');
//     });

//     // it('should parse multiline accessibility descriptions', () => {
//     //   const result = parse(
//     //     `treeView\n  accDescr {\n    Detailed description\n    across multiple lines\n  }\n  item\n`
//     //   );
//     //   expect(result.value.accDescr).toBe('Detailed description\nacross multiple lines');
//     // });
//   });
// });
