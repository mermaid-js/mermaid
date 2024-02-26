// Codapi execution engine for Mermaid.

import mermaid from 'mermaid';

// exec executes a mermaid code snippet.
const exec = async (req) => {
  try {
    const start = new Date().valueOf();
    const res = await render(req.files['']);
    const elapsed = new Date().valueOf() - start;
    return {
      ok: true,
      duration: elapsed,
      stdout: res,
      stderr: '',
    };
  } catch (exc) {
    return {
      ok: false,
      duration: 0,
      stdout: '',
      stderr: exc.toString(),
    };
  }
};

// render renders a mermaid diagram according to the spec.
const render = async (spec) => {
  const id = 'mermaid-' + hashCode(spec);
  const { svg } = await mermaid.render(id, spec);
  return svg;
};

// hashCode calculates a hashcode for a string.
const hashCode = (s) => {
  return s.split('').reduce(function (a, b) {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
};

if (!import.meta.env.SSR) {
  // register mermaid execution engine in codapi (client-only).
  import('@antonz/codapi/dist/snippet.mjs');
  window.codapi = window.codapi ?? {};
  window.codapi.engines = {
    ...window.codapi.engines,
    ...{ mermaid: { init: () => {}, exec } },
  };
}
