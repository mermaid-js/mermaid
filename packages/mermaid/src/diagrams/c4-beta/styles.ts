import * as khroma from 'khroma';

export interface C4BetaStyleOptions {
  arrowheadColor: string;
  edgeLabelBackground: string;
  fontFamily: string;
  lineColor: string;
  mainBkg: string;
  nodeBorder: string;
  nodeTextColor: string;
  textColor: string;
  titleColor: string;
  strokeWidth?: string;
}

const fade = (color: string, opacity: number) => {
  // @ts-ignore TODO: incorrect types from khroma
  const channel = khroma.channel;

  const r = channel(color, 'r');
  const g = channel(color, 'g');
  const b = channel(color, 'b');

  // @ts-ignore incorrect types from khroma
  return khroma.rgba(r, g, b, opacity);
};

const getStyles = (options: C4BetaStyleOptions) =>
  `.label {
    font-family: ${options.fontFamily};
    color: ${options.nodeTextColor || options.textColor};
  }

  .label text,span {
    fill: ${options.nodeTextColor || options.textColor};
    color: ${options.nodeTextColor || options.textColor};
  }

  .node rect,
  .node path {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder};
    stroke-width: ${options.strokeWidth ?? 1}px;
  }

  .c4-shape .label {
    color: #ffffff;
  }
  .c4-shape .label text,
  .c4-shape .label span {
    fill: #ffffff;
    color: #ffffff;
  }
  .c4-shape .label small {
    font-size: 0.75em;
  }

  .c4-external rect,
  .c4-external path,
  .c4-external circle {
    fill: #999999;
    stroke: #8A8A8A;
  }

  path.c4-rel {
    fill: none;
    stroke: ${options.lineColor};
  }

  .arrowheadPath {
    fill: ${options.arrowheadColor};
  }

  .edgeLabel {
    background-color: ${options.edgeLabelBackground};
    p {
      background-color: ${options.edgeLabelBackground};
    }
    rect {
      opacity: 0.5;
      background-color: ${options.edgeLabelBackground};
      fill: ${options.edgeLabelBackground};
    }
    text-align: center;
  }

  /* For html labels only */
  .labelBkg {
    background-color: ${fade(options.edgeLabelBackground, 0.5)};
  }

  .cluster rect {
    fill: none;
    stroke: ${options.nodeBorder};
    stroke-dasharray: 7 7;
    stroke-width: 1px;
  }

  .cluster text {
    fill: ${options.titleColor};
  }

  .cluster span {
    color: ${options.titleColor};
  }

  .c4TitleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${options.textColor};
  }
`;

export default getStyles;
