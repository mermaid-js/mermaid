import { db } from './gitGraphAst.js';
import { parser } from './gitGraphParser.js';

describe('when parsing gitGraph with click statements', function () {
  beforeEach(function () {
    db.clear();
  });

  it('should handle click "id" "url"', async () => {
    const str = `gitGraph
      commit id: "c1"
      click "c1" "https://example.com"
      `;
    await parser.parse(str);
    const link = db.getLink('c1');
    expect(link).toBeDefined();
    expect(link?.link).toBe('https://example.com');
  });

  it('should handle click "id" "url" "tooltip"', async () => {
    const str = `gitGraph
      commit id: "c1"
      click "c1" "https://example.com" "Tooltip"
      `;
    await parser.parse(str);
    const link = db.getLink('c1');
    expect(link).toBeDefined();
    expect(link?.link).toBe('https://example.com');
    expect(link?.tooltip).toBe('Tooltip');
  });

  it('should handle click "id" "url" _blank', async () => {
    const str = `gitGraph
      commit id: "c1"
      click "c1" "https://example.com" _blank
      `;
    await parser.parse(str);
    const link = db.getLink('c1');
    expect(link).toBeDefined();
    expect(link?.link).toBe('https://example.com');
    expect(link?.target).toBe('_blank');
  });

  it('should handle click "id" "url" "tooltip" _blank', async () => {
    const str = `gitGraph
      commit id: "c1"
      click "c1" "https://example.com" "Tooltip" _blank
      `;
    await parser.parse(str);
    const link = db.getLink('c1');
    expect(link).toBeDefined();
    expect(link?.link).toBe('https://example.com');
    expect(link?.tooltip).toBe('Tooltip');
    expect(link?.target).toBe('_blank');
  });
});
