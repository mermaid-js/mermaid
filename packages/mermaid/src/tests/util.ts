/*
Used to convert jest's Tagged Template literals to object arrays as required by vitest.

Example:

Jest code
```ts
it.each`
str       | expected
${'1d'}   | ${dayjs.duration(1, 'd')}
${'2w'}   | ${dayjs.duration(2, 'w')}
`('should parse $str to $expected duration', ({ str, expected }) => {
   expect(yourFunction(str)).toEqual(expected);
 });
```

Vitest code
```ts
it.each(convert`
str       | expected
${'1d'}   | ${dayjs.duration(1, 'd')}
${'2w'}   | ${dayjs.duration(2, 'w')}
`)('should parse $str to $expected duration', ({ str, expected }) => {
   expect(yourFunction(str)).toEqual(expected);
 });
```
*/

export const convert = (template: TemplateStringsArray, ...params: unknown[]) => {
  const header = template[0]
    .trim()
    .split('|')
    .map((s) => s.trim());
  if (header.length === 0 || params.length % header.length !== 0) {
    throw new Error('Table column count mismatch');
  }
  const chunkSize = header.length;
  const out = [];
  for (let i = 0; i < params.length; i += chunkSize) {
    const chunk = params.slice(i, i + chunkSize);
    out.push(Object.fromEntries(chunk.map((v, i) => [header[i], v])));
  }
  return out;
};
