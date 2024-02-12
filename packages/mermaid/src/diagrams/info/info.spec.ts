import { parser } from './infoParser.js';

describe('info', () => {
  it('should handle an info definition', async () => {
    const str = `info`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle an info definition with showInfo', async () => {
    const str = `info showInfo`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should throw because of unsupported info grammar', async () => {
    const str = `info unsupported`;
    await expect(parser.parse(str)).rejects.toThrow(
      'Parsing failed: unexpected character: ->u<- at offset: 5, skipped 11 characters.'
    );
  });

  it('should throw because of unsupported info grammar', async () => {
    const str = `info unsupported`;
    await expect(parser.parse(str)).rejects.toThrow(
      'Parsing failed: unexpected character: ->u<- at offset: 5, skipped 11 characters.'
    );
  });
});
