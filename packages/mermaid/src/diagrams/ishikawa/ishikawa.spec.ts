// @ts-expect-error No types available for JISON
import { parser as ishikawa } from './parser/ishikawa.jison';
import { IshikawaDB } from './ishikawaDb.js';
import { setLogLevel } from '../../diagram-api/diagramAPI.js';

describe('when parsing an Ishikawa diagram', function () {
  beforeEach(function () {
    ishikawa.yy = new IshikawaDB();
    ishikawa.yy.clear();
    setLogLevel('trace');
  });

  it('should parse a basic Ishikawa hierarchy', function () {
    const str = `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
`;

    ishikawa.parse(str);
    const root = ishikawa.yy.getRoot();
    expect(root?.text).toEqual('Blurry Photo');
    expect(root?.children.length).toEqual(2);
    expect(root?.children[0].text).toEqual('Process');
    expect(root?.children[0].children[0].text).toEqual('Out of focus');
    expect(root?.children[1].text).toEqual('User');
    expect(root?.children[1].children[0].text).toEqual('Shaky hands');
  });

  it('should support an unindented root with nested causes', function () {
    const str = `ishikawa-beta
Problem
Cause A
  Subcause A1
Cause B
`;

    ishikawa.parse(str);
    const root = ishikawa.yy.getRoot();
    expect(root?.text).toEqual('Problem');
    expect(root?.children.length).toEqual(2);
    expect(root?.children[0].text).toEqual('Cause A');
    expect(root?.children[0].children[0].text).toEqual('Subcause A1');
    expect(root?.children[1].text).toEqual('Cause B');
  });
});
