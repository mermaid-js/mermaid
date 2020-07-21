const getStyles = options =>
  `.pieTitleText {
    text-anchor: middle;
    font-size: 25px;
    fill: ${options.taskTextDarkColor};
    font-family: ${options.fontFamily};
  }
  .slice {
    font-family: ${options.fontFamily};
    fill: ${options.textColor};
    // fill: white;
  }
  .legend text {
    fill: ${options.taskTextDarkColor};
    font-family: ${options.fontFamily};
    font-size: 17px;
  }
`;

export default getStyles;
