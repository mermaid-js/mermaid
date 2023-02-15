import { MockedD3 } from './tests/MockedD3';
import { setA11yDiagramInfo, addSVGa11yTitleDescription } from './accessibility';
import { D3Element } from './mermaidAPI';

describe('accessibility', () => {
  const fauxSvgNode = new MockedD3();

  describe('setA11yDiagramInfo', () => {
    it('sets the svg element role to "graphics-document document"', () => {
      // @ts-ignore  Required to easily handle the d3 select types
      const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
      setA11yDiagramInfo(fauxSvgNode, 'flowchart');
      expect(svgAttrSpy).toHaveBeenCalledWith('role', 'graphics-document document');
    });

    it('sets the aria-roledescription to the diagram type', () => {
      // @ts-ignore  Required to easily handle the d3 select types
      const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
      setA11yDiagramInfo(fauxSvgNode, 'flowchart');
      expect(svgAttrSpy).toHaveBeenCalledWith('aria-roledescription', 'flowchart');
    });

    it('does not set the aria-roledescription if the diagram type is empty', () => {
      // @ts-ignore  Required to easily handle the d3 select types
      const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
      setA11yDiagramInfo(fauxSvgNode, '');
      expect(svgAttrSpy).toHaveBeenCalledTimes(1);
      expect(svgAttrSpy).toHaveBeenCalledWith('role', expect.anything()); // only called to set the role
    });
  });

  describe('addSVGa11yTitleDescription', () => {
    const givenId = 'theBaseId';

    describe('with the given svg d3 object:', () => {
      it('does nothing if there is no insert defined', () => {
        const noInsertSvg = {
          attr: vi.fn(),
        };
        const noInsertAttrSpy = vi.spyOn(noInsertSvg, 'attr').mockReturnValue(noInsertSvg);
        addSVGa11yTitleDescription(noInsertSvg, 'some title', 'some desc', givenId);
        expect(noInsertAttrSpy).not.toHaveBeenCalled();
      });

      // ----------------
      // Convenience functions to DRY up the spec

      function expectAriaLabelledByIsTitleId(
        svgD3Node: D3Element,
        title: string | null | undefined,
        desc: string | null | undefined,
        givenId: string
      ) {
        // @ts-ignore Required to easily handle the d3 select types
        const svgAttrSpy = vi.spyOn(svgD3Node, 'attr').mockReturnValue(svgD3Node);
        addSVGa11yTitleDescription(svgD3Node, title, desc, givenId);
        expect(svgAttrSpy).toHaveBeenCalledWith('aria-labelledby', `chart-title-${givenId}`);
      }

      function expectAriaDescribedByIsDescId(
        svgD3Node: D3Element,
        title: string | null | undefined,
        desc: string | null | undefined,
        givenId: string
      ) {
        // @ts-ignore Required to easily handle the d3 select types
        const svgAttrSpy = vi.spyOn(svgD3Node, 'attr').mockReturnValue(svgD3Node);
        addSVGa11yTitleDescription(svgD3Node, title, desc, givenId);
        expect(svgAttrSpy).toHaveBeenCalledWith('aria-describedby', `chart-desc-${givenId}`);
      }

      function a11yTitleTagInserted(
        svgD3Node: D3Element,
        title: string | null | undefined,
        desc: string | null | undefined,
        givenId: string,
        callNumber: number
      ) {
        a11yTagInserted(svgD3Node, title, desc, givenId, callNumber, 'title', title);
      }

      function a11yDescTagInserted(
        svgD3Node: D3Element,
        title: string | null | undefined,
        desc: string | null | undefined,
        givenId: string,
        callNumber: number
      ) {
        a11yTagInserted(svgD3Node, title, desc, givenId, callNumber, 'desc', desc);
      }

      function a11yTagInserted(
        svgD3Node: D3Element,
        title: string | null | undefined,
        desc: string | null | undefined,
        givenId: string,
        callNumber: number,
        expectedPrefix: string,
        expectedText: string | null | undefined
      ) {
        const fauxInsertedD3 = new MockedD3();
        const svgInsertSpy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(fauxInsertedD3);
        // @ts-ignore  Required to easily handle the d3 select types
        const titleAttrSpy = vi.spyOn(fauxInsertedD3, 'attr').mockReturnValue(fauxInsertedD3);
        const titleTextSpy = vi.spyOn(fauxInsertedD3, 'text');

        addSVGa11yTitleDescription(fauxSvgNode, title, desc, givenId);
        expect(svgInsertSpy).toHaveBeenCalledWith(expectedPrefix, ':first-child');
        expect(titleAttrSpy).toHaveBeenCalledWith('id', `chart-${expectedPrefix}-${givenId}`);
        expect(titleTextSpy).toHaveBeenNthCalledWith(callNumber, expectedText);
      }
      // ----------------

      describe('given an a11y title', () => {
        const a11yTitle = 'a11y title';

        describe('given an a11y description', () => {
          const a11yDesc = 'a11y description';

          it('sets aria-labelledby to the title id inserted as a child', () => {
            expectAriaLabelledByIsTitleId(fauxSvgNode, a11yTitle, a11yDesc, givenId);
          });

          it('sets aria-describedby to the description id inserted as a child', () => {
            expectAriaDescribedByIsDescId(fauxSvgNode, a11yTitle, a11yDesc, givenId);
          });

          it('inserts a title tag as the first child with the text set to the accTitle given', () => {
            a11yTitleTagInserted(fauxSvgNode, a11yTitle, a11yDesc, givenId, 2);
          });

          it('inserts a desc tag as the 2nd child with the text set to accDescription given', () => {
            a11yDescTagInserted(fauxSvgNode, a11yTitle, a11yDesc, givenId, 1);
          });
        });

        describe(`no a11y description`, () => {
          const a11yDesc = undefined;

          it('sets aria-labelledby to the title id inserted as a child', () => {
            expectAriaLabelledByIsTitleId(fauxSvgNode, a11yTitle, a11yDesc, givenId);
          });

          it('no aria-describedby is set', () => {
            // @ts-ignore Required to easily handle the d3 select types
            const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgAttrSpy).not.toHaveBeenCalledWith('aria-describedby', expect.anything());
          });

          it('inserts a title tag as the first child with the text set to the accTitle given', () => {
            a11yTitleTagInserted(fauxSvgNode, a11yTitle, a11yDesc, givenId, 1);
          });

          it('no description tag is inserted', () => {
            const fauxTitle = new MockedD3();
            const svgInsertSpy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(fauxTitle);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgInsertSpy).not.toHaveBeenCalledWith('desc', ':first-child');
          });
        });
      });

      describe('no a11y title', () => {
        const a11yTitle = undefined;

        describe('given an a11y description', () => {
          const a11yDesc = 'a11y description';

          it('no aria-labelledby is set', () => {
            // @ts-ignore Required to easily handle the d3 select types
            const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgAttrSpy).not.toHaveBeenCalledWith('aria-labelledby', expect.anything());
          });

          it('no title tag inserted', () => {
            const fauxTitle = new MockedD3();
            const svgInsertSpy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(fauxTitle);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgInsertSpy).not.toHaveBeenCalledWith('title', ':first-child');
          });

          it('sets aria-describedby to the description id inserted as a child', () => {
            expectAriaDescribedByIsDescId(fauxSvgNode, a11yTitle, a11yDesc, givenId);
          });

          it('inserts a desc tag as the 2nd child with the text set to accDescription given', () => {
            a11yDescTagInserted(fauxSvgNode, a11yTitle, a11yDesc, givenId, 1);
          });
        });

        describe('no a11y description', () => {
          const a11yDesc = undefined;

          it('no aria-labelledby is set', () => {
            // @ts-ignore Required to easily handle the d3 select types
            const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgAttrSpy).not.toHaveBeenCalledWith('aria-labelledby', expect.anything());
          });

          it('no aria-describedby is set', () => {
            // @ts-ignore Required to easily handle the d3 select types
            const svgAttrSpy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgAttrSpy).not.toHaveBeenCalledWith('aria-describedby', expect.anything());
          });

          it('no title tag inserted', () => {
            const fauxTitle = new MockedD3();
            const svgInsertSpy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(fauxTitle);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgInsertSpy).not.toHaveBeenCalledWith('title', ':first-child');
          });

          it('no description tag inserted', () => {
            const fauxDesc = new MockedD3();
            const svgInsertSpy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(fauxDesc);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svgInsertSpy).not.toHaveBeenCalledWith('desc', ':first-child');
          });
        });
      });
    });
  });
});
