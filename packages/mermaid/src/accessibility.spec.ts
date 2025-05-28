import { addSVGa11yTitleDescription, setA11yDiagramInfo } from './accessibility.js';
import { ensureNodeFromSelector, jsdomIt } from './tests/util.js';
import { select } from 'd3';
import { expect } from 'vitest';

describe('accessibility', () => {
  describe('setA11yDiagramInfo', () => {
    jsdomIt('should set svg element role to "graphics-document document"', () => {
      const svgSelection = select<SVGSVGElement, never>('svg');
      setA11yDiagramInfo(svgSelection, 'flowchart');
      const svgNode = ensureNodeFromSelector('svg');
      expect(svgNode.getAttribute('role')).toBe('graphics-document document');
    });

    jsdomIt('should set aria-roledescription to the diagram type', () => {
      const svgSelection = select<SVGSVGElement, never>('svg');
      setA11yDiagramInfo(svgSelection, 'flowchart');
      const svgNode = ensureNodeFromSelector('svg');
      expect(svgNode.getAttribute('aria-roledescription')).toBe('flowchart');
    });

    jsdomIt('should not set aria-roledescription if the diagram type is empty', () => {
      const svgSelection = select<SVGSVGElement, never>('svg');
      setA11yDiagramInfo(svgSelection, '');
      const svgNode = ensureNodeFromSelector('svg');
      expect(svgNode.getAttribute('aria-roledescription')).toBeNull();
    });
  });

  describe('addSVGa11yTitleDescription', () => {
    const givenId = 'theBaseId';

    describe('with svg d3 object', () => {
      it('should do nothing if there is no insert defined', () => {
        const noInsertSvg = {
          attr: vi.fn(),
        };
        const noInsertAttrSpy = vi.spyOn(noInsertSvg, 'attr').mockReturnValue(noInsertSvg);
        addSVGa11yTitleDescription(noInsertSvg, 'some title', 'some desc', givenId);
        expect(noInsertAttrSpy).not.toHaveBeenCalled();
      });

      describe('with a11y title', () => {
        const a11yTitle = 'a11y title';

        describe('with a11y description', () => {
          const a11yDesc = 'a11y description';

          jsdomIt('should set aria-labelledby to the title id inserted as a child', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-labelledby')).toBe(`chart-title-${givenId}`);
          });

          jsdomIt('should set aria-describedby to the description id inserted as a child', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-describedby')).toBe(`chart-desc-${givenId}`);
          });

          jsdomIt(
            'should insert title tag as the first child with the text set to the accTitle given',
            () => {
              const svgSelection = select<SVGSVGElement, never>('svg');
              addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
              const svgNode = ensureNodeFromSelector('svg');
              const titleNode = ensureNodeFromSelector('title', svgNode);
              expect(titleNode?.innerHTML).toBe(a11yTitle);
            }
          );

          jsdomIt(
            'should insert desc tag as the 2nd child with the text set to accDescription given',
            () => {
              const svgSelection = select<SVGSVGElement, never>('svg');
              addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
              const svgNode = ensureNodeFromSelector('svg');
              const descNode = ensureNodeFromSelector('desc', svgNode);
              expect(descNode?.innerHTML).toBe(a11yDesc);
            }
          );
        });

        describe(`without a11y description`, {}, () => {
          const a11yDesc = undefined;

          jsdomIt('should set aria-labelledby to the title id inserted as a child', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-labelledby')).toBe(`chart-title-${givenId}`);
          });

          jsdomIt('should not set aria-describedby', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-describedby')).toBeNull();
          });

          jsdomIt(
            'should insert title tag as the first child with the text set to the accTitle given',
            () => {
              const svgSelection = select<SVGSVGElement, never>('svg');
              addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
              const svgNode = ensureNodeFromSelector('svg');
              const titleNode = ensureNodeFromSelector('title', svgNode);
              expect(titleNode?.innerHTML).toBe(a11yTitle);
            }
          );

          jsdomIt('should not insert description tag', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            const descNode = svgNode.querySelector('desc');
            expect(descNode).toBeNull();
          });
        });
      });

      describe('without a11y title', () => {
        const a11yTitle = undefined;

        describe('with a11y description', () => {
          const a11yDesc = 'a11y description';

          jsdomIt('should not set aria-labelledby', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-labelledby')).toBeNull();
          });

          jsdomIt('should not insert title tag', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            const titleNode = svgNode.querySelector('title');
            expect(titleNode).toBeNull();
          });

          jsdomIt('should set aria-describedby to the description id inserted as a child', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-describedby')).toBe(`chart-desc-${givenId}`);
          });

          jsdomIt(
            'should insert desc tag as the 2nd child with the text set to accDescription given',
            () => {
              const svgSelection = select<SVGSVGElement, never>('svg');
              addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
              const svgNode = ensureNodeFromSelector('svg');
              const descNode = ensureNodeFromSelector('desc', svgNode);
              expect(descNode?.innerHTML).toBe(a11yDesc);
            }
          );
        });

        describe('without a11y description', () => {
          const a11yDesc = undefined;

          jsdomIt('should not set aria-labelledby', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-labelledby')).toBeNull();
          });

          jsdomIt('should not set aria-describedby', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            expect(svgNode.getAttribute('aria-describedby')).toBeNull();
          });

          jsdomIt('should not insert title tag', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            const titleNode = svgNode.querySelector('title');
            expect(titleNode).toBeNull();
          });

          jsdomIt('should not insert  description tag', () => {
            const svgSelection = select<SVGSVGElement, never>('svg');
            addSVGa11yTitleDescription(svgSelection, a11yTitle, a11yDesc, givenId);
            const svgNode = ensureNodeFromSelector('svg');
            const descNode = svgNode.querySelector('desc');
            expect(descNode).toBeNull();
          });
        });
      });
    });
  });
});
