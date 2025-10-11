declare module 'non-layered-tidy-tree-layout' {
  export class BoundingBox {
    constructor(gap: number, bottomPadding: number);
  }

  export class Layout {
    constructor(boundingBox: BoundingBox);
    layout(data: any): {
      result: any;
      boundingBox: {
        left: number;
        right: number;
        top: number;
        bottom: number;
      };
    };
  }
}
