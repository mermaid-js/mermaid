import { MockedD3 } from './tests/MockedD3';
import { setA11yDiagramInfo, addSVGa11yTitleDescription } from './accessibility';

describe('accessibility', () => {
  const fauxSvgNode = new MockedD3();

  describe('setA11yDiagramInfo', () => {
    it('sets the aria-roledescription to the diagram type', () => {
      // @ts-ignore  Required to easily handle the d3 select types
      const svg_attr_spy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
      setA11yDiagramInfo(fauxSvgNode, 'flowchart');
      expect(svg_attr_spy).toHaveBeenCalledWith('aria-roledescription', 'flowchart');
    });

    it('does nothing if the diagram type is empty', () => {
      // @ts-ignore  Required to easily handle the d3 select types
      const svg_attr_spy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
      setA11yDiagramInfo(fauxSvgNode, '');
      expect(svg_attr_spy).not.toHaveBeenCalled();
    });
  });

  describe('addSVGa11yTitleDescription', () => {
    const givenId = 'theBaseId';

    describe('with the given svg d3 object:', () => {
      it('does nothing if there is no insert defined', () => {
        const noInsertSvg = {
          attr: vi.fn(),
        };
        const noInsert_attr_spy = vi.spyOn(noInsertSvg, 'attr').mockReturnValue(noInsertSvg);
        addSVGa11yTitleDescription(noInsertSvg, 'some title', 'some desc', givenId);
        expect(noInsert_attr_spy).not.toHaveBeenCalled();
      });

      describe('given an a11y title', () => {
        const a11yTitle = 'a11y title';

        describe('given an a11y description', () => {
          const a11yDesc = 'a11y description';

          it('sets aria-labelledby to the title id and the description id inserted as children', () => {
            // @ts-ignore Required to easily handle the d3 select types
            const svg_attr_spy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_attr_spy).toHaveBeenCalledWith(
              'aria-labelledby',
              `chart-title-${givenId} chart-desc-${givenId}`
            );
          });

          it('inserts a title tag as the first child with the text set to the accTitle given', () => {
            const faux_title = new MockedD3();
            const svg_insert_spy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(faux_title);
            // @ts-ignore  Required to easily handle the d3 select types
            const title_attr_spy = vi.spyOn(faux_title, 'attr').mockReturnValue(faux_title);
            const title_text_spy = vi.spyOn(faux_title, 'text');

            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_insert_spy).toHaveBeenCalledWith('desc', ':first-child');
            expect(title_attr_spy).toHaveBeenCalledWith('id', `chart-desc-` + givenId);
            expect(title_text_spy).toHaveBeenNthCalledWith(1, 'a11y description');
          });

          it('inserts a desc tag as the 2nd child with the text set to accDescription given', () => {
            const faux_desc = new MockedD3();
            const svg_insert_spy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(faux_desc);
            // @ts-ignore  Required to easily handle the d3 select types
            const desc_attr_spy = vi.spyOn(faux_desc, 'attr').mockReturnValue(faux_desc);
            const desc_text_spy = vi.spyOn(faux_desc, 'text');

            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_insert_spy).toHaveBeenCalledWith('desc', ':first-child');
            expect(desc_attr_spy).toHaveBeenCalledWith('id', `chart-desc-` + givenId);
            expect(desc_text_spy).toHaveBeenNthCalledWith(1, 'a11y description');
          });
        });

        describe(`no a11y description`, () => {
          const a11yDesc = undefined;

          it('sets aria-labelledby to the title id inserted as a child', () => {
            // @ts-ignore Required to easily handle the d3 select types
            const svg_attr_spy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_attr_spy).toHaveBeenCalledWith('aria-labelledby', `chart-title-${givenId}`);
          });

          it('inserts a title tag as the first child with the text set to the accTitle given', () => {
            const faux_title = new MockedD3();
            const svg_insert_spy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(faux_title);
            // @ts-ignore  Required to easily handle the d3 select types
            const title_attr_spy = vi.spyOn(faux_title, 'attr').mockReturnValue(faux_title);
            const title_text_spy = vi.spyOn(faux_title, 'text');

            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_insert_spy).toHaveBeenCalledWith('title', ':first-child');
            expect(title_attr_spy).toHaveBeenCalledWith('id', `chart-title-` + givenId);
            expect(title_text_spy).toHaveBeenNthCalledWith(1, 'a11y title');
          });

          it('no description tag is inserted', () => {
            const faux_title = new MockedD3();
            const svg_insert_spy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(faux_title);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_insert_spy).not.toHaveBeenCalledWith('desc', ':first-child');
          });
        });
      });

      describe('no a11y title', () => {
        const a11yTitle = undefined;

        describe('given an a11y description', () => {
          const a11yDesc = 'a11y description';

          it('no title tag inserted', () => {
            const faux_title = new MockedD3();
            const svg_insert_spy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(faux_title);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_insert_spy).not.toHaveBeenCalledWith('title', ':first-child');
          });

          it('sets aria-labelledby to the description id inserted as a child', () => {
            // @ts-ignore Required to easily handle the d3 select types
            const svg_attr_spy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_attr_spy).toHaveBeenCalledWith('aria-labelledby', `chart-desc-${givenId}`);
          });

          it('inserts a desc tag as a child with the text set to accDescription given', () => {
            const faux_desc = new MockedD3();
            const svg_insert_spy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(faux_desc);
            // @ts-ignore  Required to easily handle the d3 select types
            const desc_attr_spy = vi.spyOn(faux_desc, 'attr').mockReturnValue(faux_desc);
            const desc_text_spy = vi.spyOn(faux_desc, 'text');

            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_insert_spy).toHaveBeenCalledWith('desc', ':first-child');
            expect(desc_attr_spy).toHaveBeenCalledWith('id', `chart-desc-` + givenId);
            expect(desc_text_spy).toHaveBeenNthCalledWith(1, 'a11y description');
          });
        });

        describe('no a11y description', () => {
          const a11yDesc = undefined;

          it('no title tag inserted', () => {
            const faux_title = new MockedD3();
            const svg_insert_spy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(faux_title);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_insert_spy).not.toHaveBeenCalledWith('title', ':first-child');
          });

          it('no description tag inserted', () => {
            const faux_desc = new MockedD3();
            const svg_insert_spy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(faux_desc);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_insert_spy).not.toHaveBeenCalledWith('desc', ':first-child');
          });

          it('no aria-labelledby is set', () => {
            // @ts-ignore Required to easily handle the d3 select types
            const svg_attr_spy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
            addSVGa11yTitleDescription(fauxSvgNode, a11yTitle, a11yDesc, givenId);
            expect(svg_attr_spy).not.toHaveBeenCalled();
          });
        });
      });
    });
  });
});
