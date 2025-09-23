import { ErDB } from '../erDb.js';
import erDiagram from './erDiagram.jison';
import { setConfig } from '../../../config.js';
import { vi } from 'vitest';
const spyOn = vi.spyOn;

setConfig({
  securityLevel: 'strict',
});

describe('[Interactions] when parsing ER diagram', () => {
  let erDb;
  beforeEach(function () {
    erDb = new ErDB();
    erDiagram.parser.yy = erDb;
    erDiagram.parser.yy.clear();
  });

  it('should be possible to use click to call a callback', function () {
    spyOn(erDb, 'setClickEvent');
    const res = erDiagram.parser.parse('erDiagram\nCUSTOMER\nclick CUSTOMER call testCallback');

    expect(erDb.setClickEvent).toHaveBeenCalledWith('CUSTOMER', 'testCallback');
  });

  it('should be possible to use click to call a callback with arguments', function () {
    spyOn(erDb, 'setClickEvent');
    erDiagram.parser.parse('erDiagram\nCUSTOMER\nclick CUSTOMER call testCallback(\'arg1\', "arg2")');

    expect(erDb.setClickEvent).toHaveBeenCalledWith('CUSTOMER', 'testCallback', '\'arg1\', "arg2"');
  });

  it('should be possible to use click to link to an external URL', function () {
    spyOn(erDb, 'setLink');
    erDiagram.parser.parse('erDiagram\nCUSTOMER\nclick CUSTOMER "http://example.com"');

    expect(erDb.setLink).toHaveBeenCalledWith('CUSTOMER', 'http://example.com');
  });

  it('should be possible to use click to link to an external URL with target', function () {
    spyOn(erDb, 'setLink');
    erDiagram.parser.parse('erDiagram\nCUSTOMER\nclick CUSTOMER href "http://example.com" _blank');

    expect(erDb.setLink).toHaveBeenCalledWith('CUSTOMER', 'http://example.com', '_blank');
  });
});