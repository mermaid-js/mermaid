// Spec/tests for accessibility

import { setA11yDiagramInfo, addSVGa11yTitleDescription } from './accessibility';

import { MockedD3 } from './tests/MockedD3';

const fauxSvgNode = new MockedD3();

const MockedDiagramDb = {
  getAccTitle: vi.fn().mockReturnValue('the title'),
  getAccDescription: vi.fn().mockReturnValue('the description'),
};

describe('setA11yDiagramInfo', () => {
  it('sets the aria-roledescription to the diagram type', () => {
    // @ts-ignore  Required to easily handle the d3 select types
    const svg_attr_spy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
    setA11yDiagramInfo(fauxSvgNode, 'flowchart');
    expect(svg_attr_spy).toHaveBeenCalledWith('aria-roledescription', 'flowchart');
  });
});

describe('addSVGa11yTitleDescription', () => {
  const testDiagramDb = MockedDiagramDb;
  const givenId = 'theBaseId';

  describe('with the given svg d3 object:', () => {
    it('does nothing if there is no insert defined', () => {
      const noInsertSvg = {
        attr: vi.fn(),
      };
      const noInsert_attr_spy = vi.spyOn(noInsertSvg, 'attr').mockReturnValue(noInsertSvg);
      addSVGa11yTitleDescription(testDiagramDb, noInsertSvg, givenId);
      expect(noInsert_attr_spy).not.toHaveBeenCalled();
    });

    it('sets aria-labelledby to the title id and the description id inserted as children', () => {
      // @ts-ignore Required to easily handle the d3 select types
      const svg_attr_spy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);
      addSVGa11yTitleDescription(testDiagramDb, fauxSvgNode, givenId);
      expect(svg_attr_spy).toHaveBeenCalledWith(
        'aria-labelledby',
        `chart-title-${givenId} chart-desc-${givenId}`
      );
    });

    it('inserts a title tag as the first child with the text set to the accTitle returned by the diagram db', () => {
      const faux_title = new MockedD3();
      const svg_insert_spy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(faux_title);
      // @ts-ignore  Required to easily handle the d3 select types
      const title_attr_spy = vi.spyOn(faux_title, 'attr').mockReturnValue(faux_title);
      const title_text_spy = vi.spyOn(faux_title, 'text');

      addSVGa11yTitleDescription(testDiagramDb, fauxSvgNode, givenId);
      expect(svg_insert_spy).toHaveBeenCalledWith('title', ':first-child');
      expect(title_attr_spy).toHaveBeenCalledWith('id', `chart-title-` + givenId);
      expect(title_text_spy).toHaveBeenNthCalledWith(2, 'the title');
    });

    it('inserts a desc tag as the 2nd child with the text set to accDescription returned by the diagram db', () => {
      const faux_desc = new MockedD3();
      const svg_insert_spy = vi.spyOn(fauxSvgNode, 'insert').mockReturnValue(faux_desc);
      // @ts-ignore  Required to easily handle the d3 select types
      const desc_attr_spy = vi.spyOn(faux_desc, 'attr').mockReturnValue(faux_desc);
      const desc_text_spy = vi.spyOn(faux_desc, 'text');

      addSVGa11yTitleDescription(testDiagramDb, fauxSvgNode, givenId);
      expect(svg_insert_spy).toHaveBeenCalledWith('desc', ':first-child');
      expect(desc_attr_spy).toHaveBeenCalledWith('id', `chart-desc-` + givenId);
      expect(desc_text_spy).toHaveBeenNthCalledWith(1, 'the description');
    });
  });
});
