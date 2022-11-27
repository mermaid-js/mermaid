/**
 * This is a mocked/stubbed version of the d3 Selection type. Each of the main functions are all
 * mocked (via vi.fn()) so you can track if they have been called, etc.
 *
 * Note that node() returns a HTML Element with tag 'svg'. It is an empty element (no innerHTML, no children, etc).
 * This potentially allows testing of mermaidAPI render().
 */

export class MockedD3 {
  public attribs = new Map<string, string | null>();
  public id: string | undefined = '';
  _children: MockedD3[] = [];

  _containingHTMLdoc = new Document();

  constructor(givenId = 'mock-id') {
    this.id = givenId;
  }

  /** Helpful utility during development/debugging. This is not a real d3 function */
  public listChildren(): string {
    return this._children
      .map((child) => {
        return child.id;
      })
      .join(', ');
  }

  select = vi.fn().mockImplementation(({ select_str = '' }): MockedD3 => {
    // Get the id from an argument string. if it is of the form [id='some-id'], strip off the
    // surrounding id[..]
    const stripSurroundRegexp = /\[id='(.*)'\]/;
    const matchedSurrounds = select_str.match(stripSurroundRegexp);
    const cleanId = matchedSurrounds ? matchedSurrounds[1] : select_str;
    return new MockedD3(cleanId);
  });

  // This has the same implementation as select(). (It calls it.)
  selectAll = vi.fn().mockImplementation(({ select_str = '' }): MockedD3 => {
    return this.select(select_str);
  });

  append = vi
    .fn()
    .mockImplementation(function (this: MockedD3, type: string, id = '' + '-appended'): MockedD3 {
      const newMock = new MockedD3(id);
      newMock.attribs.set('type', type);
      this._children.push(newMock);
      return newMock;
    });

  // NOTE: The d3 implementation allows for a selector ('beforeSelector' arg below).
  //   With this mocked implementation, we assume it will always refer to an node id
  //   and will always be of the form "#[id of the node to insert before]".
  //   To keep this simple, any leading '#' is removed and the resulting string is the node id searched.
  insert = (type: string, beforeSelector?: string, id = this.id + '-inserted'): MockedD3 => {
    const newMock = new MockedD3(id);
    newMock.attribs.set('type', type);
    if (beforeSelector === undefined) {
      this._children.push(newMock);
    } else {
      const idOnly = beforeSelector[0] == '#' ? beforeSelector.substring(1) : beforeSelector;
      const foundIndex = this._children.findIndex((child) => child.id === idOnly);
      if (foundIndex < 0) {
        this._children.push(newMock);
      } else {
        this._children.splice(foundIndex, 0, newMock);
      }
    }
    return newMock;
  };

  attr(attrName: string): null | undefined | string | number;
  // attr(attrName: string, attrValue: string): MockedD3;
  attr(attrName: string, attrValue?: string): null | undefined | string | number | MockedD3 {
    if (arguments.length === 1) {
      return this.attribs.get(attrName);
    } else {
      if (attrName === 'id') {
        this.id = attrValue; // also set the id explicitly
      }
      if (attrValue !== undefined) {
        this.attribs.set(attrName, attrValue);
      }
      return this;
    }
  }

  public lower(attrValue = '') {
    this.attribs.set('lower', attrValue);
    return this;
  }
  public style(attrValue = '') {
    this.attribs.set('style', attrValue);
    return this;
  }
  public text(attrValue = '') {
    this.attribs.set('text', attrValue);
    return this;
  }

  // NOTE: Returns a HTML Element with tag 'svg' that has _another_ 'svg' element child.
  // This allows different tests to succeed -- some need a top level 'svg' and some need a 'svg' element to be the firstChild
  // Real implementation returns an HTML Element
  public node = vi.fn().mockImplementation(() => {
    const topElem = this._containingHTMLdoc.createElement('svg');
    const elem_svgChild = this._containingHTMLdoc.createElement('svg'); // another svg element
    topElem.appendChild(elem_svgChild);
    return topElem;
  });

  // TODO Is this correct? shouldn't it return a list of HTML Elements?
  nodes = vi.fn().mockImplementation(function (this: MockedD3): MockedD3[] {
    return this._children;
  });

  // This will try to use attrs that have been set.
  getBBox = () => {
    const x = this.attribs.has('x') ? this.attribs.get('x') : 20;
    const y = this.attribs.has('y') ? this.attribs.get('y') : 30;
    const width = this.attribs.has('width') ? this.attribs.get('width') : 140;
    const height = this.attribs.has('height') ? this.attribs.get('height') : 250;
    return {
      x: x,
      y: y,
      width: width,
      height: height,
    };
  };

  // --------------------------------------------------------------------------------
  // The following functions are here for completeness.  They simply return a vi.fn()

  insertBefore = vi.fn();
  curveBasis = vi.fn();
  curveBasisClosed = vi.fn();
  curveBasisOpen = vi.fn();
  curveLinear = vi.fn();
  curveLinearClosed = vi.fn();
  curveMonotoneX = vi.fn();
  curveMonotoneY = vi.fn();
  curveNatural = vi.fn();
  curveStep = vi.fn();
  curveStepAfter = vi.fn();
  curveStepBefore = vi.fn();
}
