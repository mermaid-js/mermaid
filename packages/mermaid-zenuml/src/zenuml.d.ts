declare module '@zenuml/core' {
  export interface RenderOptions {
    theme?: string;
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
