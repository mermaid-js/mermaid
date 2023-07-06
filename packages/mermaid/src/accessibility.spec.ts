import { MockedD3 } from './tests/MockedD3.js';
import { setA11yDiagramInfo, addSVGa11yTitleDescription } from './accessibility.js';
import type { D3Element } from './mermaidAPI.js';

describe('accessibility', () => {
  const fauxSvgNode: MockedD3 = new MockedD3();

  describe('setA11yDiagramInfo', () => {
    it('should set svg element role to "graphics-document document"', () => {
      const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
      setA11yDiagramInfo(fauxSvgNode, 'flowchart');
      expect(svgAttrSpy).toHaveBeenCalledWith('role', 'graphics-document document');
    });

    it('should set aria-roledescription to the diagram type', () => {
      const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
      setA11yDiagramInfo(fauxSvgNode, 'flowchart');
      expect(svgAttrSpy).toHaveBeenCalledWith('aria-roledescription', 'flowchart');
    });

    it('should not set aria-roledescription if the diagram type is empty', () => {
      const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
      setA11yDiagramInfo(fauxSvgNode, '');
      expect(svgAttrSpy).toHaveBeenCalledTimes(1);
      expect(svgAttrSpy).toHaveBeenCalledWith('role', expect.anything()); // only called to set the role
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

      // convenience functions to DRY up the spec

      function expectAriaLabelledByItTitleId(
        svgD3Node: D3Element,
        title: string | undefined,
        desc: string | undefined,
        givenId: string
      ): void {
        const svgAttrSpy = vi.spyOn(svgD3Node, 'attr').mockReturnValue(svgD3Node);
        addSVGa11yTitleDescription(svgD3Node, title, desc, givenId);
        expect(svgAttrSpy).toHaveBeenCalledWith('aria-labelledby', `chart-title-${givenId}`);
      }

      function expectAriaDescribedByItDescId(
        svgD3Node: D3Element,
        title: string | undefined,
        desc: string | undefined,
        givenId: string
      ): void {
        const svgAttrSpy = vi.spyOn(svgD3Node, 'attr').mockReturnValue(svgD3Node);
        addSVGa11yTitleDescription(svgD3Node, title, desc, givenId);
        expect(svgAttrSpy).toHaveBeenCalledWith('aria-describedby', `chart-desc-${givenId}`);
      }

      function a11yTitleTagInserted(
        svgD3Node: D3Element,
        title: string | undefined,
        desc: string | undefined,
        givenId: string,
        callNumber: number
      ): void {
        a11yTagInserted(svgD3Node, title, desc, givenId, callNumber, 'title', title);
      }

      function a11yDescTagInserted(
        svgD3Node: D3Element,
        title: string | undefined,
        desc: string | undefined,
        givenId: string,
        callNumber: number
      ): void {
        a11yTagInserted(svgD3Node, title, desc, givenId, callNumber, 'desc', desc);
      }

      function a11yTagInserted(
        _svgD3Node: D3Element,
        title: string | undefined,
        desc: string | undefined,
        givenId: string,
        callNumber: number,
        expectedPrefix: string,
        expectedText: string | undefined
      ): void {
        const fauxInsertedD3: MockedD3 = new MockedD3();
        const svginsertpy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(fauxInsertedD3);
        const titleAttrSpy = vi.spyOn(fauxInsertedD3, 'attr').mockReturnValue(fauxInsertedD3);
        const titleTextSpy = vi.spyOn(fauxInsertedD3, 'text');

        addSVGa11yTitleDescription(fauxSvgNode, title, desc, givenId);
        expect(svginsertpy).toHaveBeenCalledWith(expectedPrefix, ':first-child');
        expect(titleAttrSpy).toHaveBeenCalledWith('id', `chart-${expectedPrefix}-${givenId}`);
        expect(titleTextSpy).toHaveBeenNthCalledWith(callNumber, expectedText);
      }

      describe('with a11y title', () => {
        const a11yTitle = 'a11y title';

        describe('with a11y description', () => {
          const a11yDesc = 'a11y description';

          it('shold set aria-labelledby to the title id inserted as a child', () => {
            expectAriaLabelledByItTitleId(fauxSvgNode, a11yTitle, a11yDesc, givenId);
          });

          it('should set aria-describedby to the description id inserted as a child', () => {
            expectAriaDescribedByItDescId(fauxSvgNode, a11yTitle, a11yDesc, givenId);
          });

          it('should insert title tag as the first child with the text set to the accTitle given', () => {
            a11yTitleTagInserted(fauxSvgNode, a11yTitle, a11yDesc, givenId, 2);
          });

          it('should insert desc tag as the 2nd child with the text set to accDescription given', () => {
            a11yDescTagInserted(fauxSvgNode, a11yTitle, a11yDesc, givenId, 1);
          });
        });

        describe(`without a11y description`, () => {
          const a11yDesc = undefined;

          it('should set aria-labelledby to the title id inserted as a child', () => {
            expectAriaLabelledByItTitleId(fauxSvgNode, a11yTitle, a11yDesc, givenId);
          });

          it('should not set aria-describedby', () => {
            const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgAttrSpy).not.toHaveBeenCalledWith('aria-describedby', expect.anything());
          });

          it('should insert title tag as the first child with the text set to the accTitle given', () => {
            a11yTitleTagInserted(fauxSvgNode, a11yTitle, a11yDesc, givenId, 1);
          });

          it('should not insert description tag', () => {
            const fauxTitle: MockedD3 = new MockedD3();
            const svginsertpy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(fauxTitle);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svginsertpy).not.toHaveBeenCalledWith('desc', ':first-child');
          });
        });
      });

      describe('without a11y title', () => {
        const a11yTitle = undefined;

        describe('with a11y description', () => {
          const a11yDesc = 'a11y description';

          it('should not set aria-labelledby', () => {
            const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgAttrSpy).not.toHaveBeenCalledWith('aria-labelledby', expect.anything());
          });

          it('should not insert title tag', () => {
            const fauxTitle: MockedD3 = new MockedD3();
            const svginsertpy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(fauxTitle);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svginsertpy).not.toHaveBeenCalledWith('title', ':first-child');
          });

          it('should set aria-describedby to the description id inserted as a child', () => {
            expectAriaDescribedByItDescId(fauxSvgNode, a11yTitle, a11yDesc, givenId);
          });

          it('should insert desc tag as the 2nd child with the text set to accDescription given', () => {
            a11yDescTagInserted(fauxSvgNode, a11yTitle, a11yDesc, givenId, 1);
          });
        });

        describe('without a11y description', () => {
          const a11yDesc = undefined;

          it('should not set aria-labelledby', () => {
            const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgAttrSpy).not.toHaveBeenCalledWith('aria-labelledby', expect.anything());
          });

          it('should not set aria-describedby', () => {
            const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgAttrSpy).not.toHaveBeenCalledWith('aria-describedby', expect.anything());
          });

          it('should not insert title tag', () => {
            const fauxTitle: MockedD3 = new MockedD3();
            const svginsertpy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(fauxTitle);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svginsertpy).not.toHaveBeenCalledWith('title', ':first-child');
          });

          it('should not insert  description tag', () => {
            const fauxDesc: MockedD3 = new MockedD3();
            const svginsertpy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(fauxDesc);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svginsertpy).not.toHaveBeenCalledWith('desc', ':first-child');
          });
        });
      });
    });
  });
});
