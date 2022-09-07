export const convert = (template: TemplateStringsArray, ...params: any[]) => {
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
