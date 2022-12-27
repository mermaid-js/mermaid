import { formatText } from '@/utils/StringUtil';

describe('StringUtil', () => {
  it.each([
    ['A\nB\n\rC\n', 'A B C'],
    ['A . m ( 1 , 2 ) ;', 'A.m(1,2);'],
    ['"A .m"', 'A.m'],
    ['"A .m"', 'A.m'],
    ['"method name"()', '"method name"()'],
  ])('removes change-lines', (original, formatted) => {
    expect(formatText(original)).toEqual(formatted);
  });
});
