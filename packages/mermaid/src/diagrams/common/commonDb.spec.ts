import {
  clear,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,
  setDiagramTitle,
  getDiagramTitle,
} from './commonDb.js';

beforeEach(() => {
  clear();
});

describe('commonDb plain-text accessors', () => {
  it('stores diagramTitle containing & and < without HTML-encoding', () => {
    setDiagramTitle('Q&A < draft');
    expect(getDiagramTitle()).toBe('Q&A < draft');
  });

  it('stores accTitle containing & and < without HTML-encoding', () => {
    setAccTitle('Latency < 5 ms & throughput');
    expect(getAccTitle()).toBe('Latency < 5 ms & throughput');
  });

  it('strips tags but keeps surrounding text in accTitle', () => {
    setAccTitle('Requests & replies <go> from A to B');
    expect(getAccTitle()).toBe('Requests & replies  from A to B');
  });

  it('stores accDescription containing & and < without HTML-encoding', () => {
    setAccDescription('A diagram showing latency < 5 ms & throughput');
    expect(getAccDescription()).toBe('A diagram showing latency < 5 ms & throughput');
  });

  it('stores plain text without special characters unchanged', () => {
    setDiagramTitle('My Pie Chart');
    expect(getDiagramTitle()).toBe('My Pie Chart');
  });

  it('does not need a DOM to store a title', async () => {
    // entityDecode caches its decoder element, so load fresh modules with no document.
    vi.resetModules();
    vi.stubGlobal('document', undefined);
    try {
      const db = await import('./commonDb.js');
      expect(() => db.setDiagramTitle('Q&A < draft')).not.toThrow();
      expect(() => db.setAccTitle('Latency < 5 ms & throughput')).not.toThrow();
      expect(() => db.setAccDescription('Requests & replies')).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
