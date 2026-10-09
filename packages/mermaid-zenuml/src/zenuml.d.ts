declare module '@zenuml/core' {
  interface RenderOptions {
    theme?: string;
    mode?: string;
  }

  export default class ZenUml {
    constructor(container: Element);
    render(text: string, options?: RenderOptions): Promise<void>;
  }
}
