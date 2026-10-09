export interface VennChartStyleOptions {
  vennTitleTextColor: string;
  vennSetTextColor: string;
  fontFamily: string;
  textColor: string;
}

const getStyles = (options: VennChartStyleOptions) =>
  `
  .venn-title {
    font-size: 32px;
    fill: ${options.vennTitleTextColor};
    font-family: ${options.fontFamily};
  }

  .venn-circle text {
    font-size: 48px;
    font-family: ${options.fontFamily};
  }

  .venn-intersection text {
    font-size: 48px;
    fill: ${options.vennSetTextColor};
    font-family: ${options.fontFamily};
  }

  .venn-text-node {
    font-family: ${options.fontFamily};
    color: ${options.vennSetTextColor};
  }
`;

export default getStyles;
