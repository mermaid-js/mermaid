export interface Point {
  x: number;
  y: number;
}

export interface TextDimensionConfig {
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
}

export interface TextDimensions {
  width: number;
  height: number;
  lineHeight?: number;
}
