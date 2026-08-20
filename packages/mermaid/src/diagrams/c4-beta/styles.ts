import * as khroma from 'khroma';

export interface C4BetaStyleOptions {
  arrowheadColor: string;
  background?: string;
  edgeLabelBackground: string;
  fontFamily: string;
  lineColor: string;
  mainBkg: string;
  nodeBorder: string;
  nodeTextColor: string;
  textColor: string;
  titleColor: string;
  strokeWidth?: string;
  c4PersonBkg: string;
  c4PersonBorder: string;
  c4SystemBkg: string;
  c4SystemBorder: string;
  c4ContainerBkg: string;
  c4ContainerBorder: string;
  c4ComponentBkg: string;
  c4ComponentBorder: string;
  c4ExternalBkg: string;
  c4ExternalBorder: string;
  c4InfrastructureBkg: string;
  c4InfrastructureBorder: string;
  c4BoundaryBorder: string;
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

  /* C4 elements are white boxes (the diagram background) with a coloured outline,
   * matching c4model.com and the legacy C4 renderer. The circle selector covers the
   * person head so it is not left with the shape's default (black) fill. */
  .node rect,
  .node path,
  .node circle {
    fill: ${options.background ?? '#ffffff'};
    stroke: ${options.nodeBorder};
    stroke-width: ${options.strokeWidth ?? 1}px;
  }

  /* C4 OUTLINE language: every element keeps the themed background fill from the
   * .node rect rule above; each kind only contributes an identity-coloured border.
   * The matching identity colour is reused for the label text below. Tag styles
   * emitted by the db as inline styles still win over these class-based rules. */
  .c4-person rect,
  .c4-person path,
  .c4-person circle {
    stroke: ${options.c4PersonBkg};
  }
  .c4-softwareSystem rect,
  .c4-softwareSystem path,
  .c4-softwareSystem circle {
    stroke: ${options.c4SystemBkg};
  }
  .c4-container rect,
  .c4-container path,
  .c4-container circle {
    stroke: ${options.c4ContainerBkg};
  }
  .c4-component rect,
  .c4-component path,
  .c4-component circle {
    stroke: ${options.c4ComponentBkg};
  }
  .c4-infrastructureNode rect,
  .c4-infrastructureNode path,
  .c4-infrastructureNode circle {
    stroke: ${options.c4InfrastructureBkg};
  }
  /* Last so it wins over the kind rules for external elements. */
  .c4-external rect,
  .c4-external path,
  .c4-external circle {
    stroke: ${options.c4ExternalBkg};
  }

  /* Identity-coloured label text, matching each element's outline border. */
  .c4-person .label,
  .c4-person .label text,
  .c4-person .label span {
    fill: ${options.c4PersonBkg};
    color: ${options.c4PersonBkg};
  }
  .c4-softwareSystem .label,
  .c4-softwareSystem .label text,
  .c4-softwareSystem .label span {
    fill: ${options.c4SystemBkg};
    color: ${options.c4SystemBkg};
  }
  .c4-container .label,
  .c4-container .label text,
  .c4-container .label span {
    fill: ${options.c4ContainerBkg};
    color: ${options.c4ContainerBkg};
  }
  .c4-component .label,
  .c4-component .label text,
  .c4-component .label span {
    fill: ${options.c4ComponentBkg};
    color: ${options.c4ComponentBkg};
  }
  .c4-infrastructureNode .label,
  .c4-infrastructureNode .label text,
  .c4-infrastructureNode .label span {
    fill: ${options.c4InfrastructureBkg};
    color: ${options.c4InfrastructureBkg};
  }
  /* Last so it wins over the kind rules for external elements. */
  .c4-external .label,
  .c4-external .label text,
  .c4-external .label span {
    fill: ${options.c4ExternalBkg};
    color: ${options.c4ExternalBkg};
  }
  .c4-shape .label small {
    font-size: 0.75em;
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
    stroke: ${options.c4BoundaryBorder};
    stroke-dasharray: 7 7;
    stroke-width: 1px;
  }

  .cluster small {
    font-size: 0.75em;
    opacity: 0.85;
  }

  .cluster text {
    fill: ${options.titleColor};
  }

  .cluster span {
    color: ${options.titleColor};
  }

  .c4-instances {
    font-size: 0.75em;
    font-weight: bold;
    opacity: 0.7;
  }

  .c4TitleText {
    text-anchor: middle;
    font-size: 1.5em;
    fill: ${options.textColor};
  }
`;

export default getStyles;
