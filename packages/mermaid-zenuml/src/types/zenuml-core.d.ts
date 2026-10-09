// Override @zenuml/core types for nodenext module resolution.
// The package lacks "type": "module" so TS treats it as CJS,
// rejecting named imports. This declaration fixes that.
declare module '@zenuml/core' {
  export interface RenderOptions {
    theme?: 'theme-default' | 'theme-mermaid';
  }

  export interface RenderResult {
    svg: string;
    innerSvg: string;
    width: number;
    height: number;
    viewBox: string;
  }

  export function renderToSvg(code: string, options?: RenderOptions): RenderResult;
}
