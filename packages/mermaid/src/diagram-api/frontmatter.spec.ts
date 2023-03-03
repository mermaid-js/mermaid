import { vi } from 'vitest';
import { extractFrontMatter } from './frontmatter.js';

const dbMock = () => ({ setDiagramTitle: vi.fn() });

describe('extractFrontmatter', () => {
  it('returns text unchanged if no frontmatter', () => {
    expect(extractFrontMatter('diagram', dbMock())).toEqual('diagram');
  });

  it('returns text unchanged if frontmatter lacks closing delimiter', () => {
    const text = `---\ntitle: foo\ndiagram`;
    expect(extractFrontMatter(text, dbMock())).toEqual(text);
  });

  it('handles empty frontmatter', () => {
    const db = dbMock();
    const text = `---\n\n---\ndiagram`;
    expect(extractFrontMatter(text, db)).toEqual('diagram');
    expect(db.setDiagramTitle).not.toHaveBeenCalled();
  });

  it('handles frontmatter without mappings', () => {
    const db = dbMock();
    const text = `---\n1\n---\ndiagram`;
    expect(extractFrontMatter(text, db)).toEqual('diagram');
    expect(db.setDiagramTitle).not.toHaveBeenCalled();
  });

  it('does not try to parse frontmatter at the end', () => {
    const db = dbMock();
    const text = `diagram\n---\ntitle: foo\n---\n`;
    expect(extractFrontMatter(text, db)).toEqual(text);
    expect(db.setDiagramTitle).not.toHaveBeenCalled();
  });

  it('handles frontmatter with multiple delimiters', () => {
    const db = dbMock();
    const text = `---\ntitle: foo---bar\n---\ndiagram\n---\ntest`;
    expect(extractFrontMatter(text, db)).toEqual('diagram\n---\ntest');
    expect(db.setDiagramTitle).toHaveBeenCalledWith('foo---bar');
  });

  it('handles frontmatter with multi-line string and multiple delimiters', () => {
    const db = dbMock();
    const text = `---\ntitle: |\n   multi-line string\n   ---\n---\ndiagram`;
    expect(extractFrontMatter(text, db)).toEqual('diagram');
    expect(db.setDiagramTitle).toHaveBeenCalledWith('multi-line string\n---\n');
  });

  it('handles frontmatter with title', () => {
    const db = dbMock();
    const text = `---\ntitle: foo\n---\ndiagram`;
    expect(extractFrontMatter(text, db)).toEqual('diagram');
    expect(db.setDiagramTitle).toHaveBeenCalledWith('foo');
  });

  it('handles booleans in frontmatter properly', () => {
    const db = dbMock();
    const text = `---\ntitle: true\n---\ndiagram`;
    expect(extractFrontMatter(text, db)).toEqual('diagram');
    expect(db.setDiagramTitle).toHaveBeenCalledWith('true');
  });

  it('ignores unspecified frontmatter keys', () => {
    const db = dbMock();
    const text = `---\ninvalid: true\ntitle: foo\ntest: bar\n---\ndiagram`;
    expect(extractFrontMatter(text, db)).toEqual('diagram');
    expect(db.setDiagramTitle).toHaveBeenCalledWith('foo');
  });

  it('throws exception for invalid YAML syntax', () => {
    const text = `---\n!!!\n---\ndiagram`;
    expect(() => extractFrontMatter(text, dbMock())).toThrow(
      'tag suffix cannot contain exclamation marks'
    );
  });
});
