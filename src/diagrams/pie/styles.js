const getStyles = options =>
  `.pieTitleText {
    text-anchor: middle;
    font-size: 25px;
    fill: ${options.taskTextDarkColor};
    font-family: ${options.fontFamily};
  }
  .slice {
    font-family: ${options.fontFamily};
  }
  .legend text {
    font-family: ${options.fontFamily};
    font-size: 17px;
  }
`;

export default getStyles;
