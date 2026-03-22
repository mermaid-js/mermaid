// cspell:ignore usecase usecases usecasediagram
const getStyles = (options: Record<string, string>): string => {
  const primaryColor       = options.primaryColor       ?? '#61c1ed';
  const primaryTextColor   = options.primaryTextColor   ?? '#000000';
  const primaryBorderColor = options.primaryBorderColor ?? '#000000';
  const lineColor          = options.lineColor          ?? '#000000';
  const secondaryColor     = options.secondaryColor     ?? '#daeef9';
  const tertiaryColor      = options.tertiaryColor      ?? '#fffde7';
  const fontFamily         = options.fontFamily         ?? 'Helvetica, Arial, sans-serif';
  const fontSize           = options.fontSize           ?? '12px';

  return `
  .uc-actor circle,
  .uc-actor line {
    stroke: ${primaryBorderColor};
    fill: none;
  }
  .uc-actor text {
    fill: ${primaryTextColor};
    font-family: ${fontFamily};
    font-size: ${fontSize};
    font-weight: bold;
  }
  .uc-usecase ellipse {
    fill: ${primaryColor};
    stroke: ${primaryBorderColor};
  }
  .uc-usecase text {
    fill: ${primaryTextColor};
    font-family: ${fontFamily};
    font-size: ${fontSize};
    font-weight: bold;
  }
  .uc-collaboration ellipse {
    fill: none;
    stroke: ${primaryBorderColor};
    stroke-dasharray: 6,4;
  }
  .uc-collaboration text {
    fill: ${primaryTextColor};
    font-family: ${fontFamily};
    font-size: ${fontSize};
    font-weight: bold;
  }
  .uc-system rect {
    fill: ${secondaryColor};
    stroke: ${primaryBorderColor};
  }
  .uc-system text {
    fill: ${primaryTextColor};
    font-family: ${fontFamily};
    font-size: 16px;
    font-weight: bold;
  }
  .uc-external rect {
    fill: ${primaryColor};
    stroke: ${primaryBorderColor};
  }
  .uc-external text {
    fill: ${primaryTextColor};
    font-family: ${fontFamily};
    font-size: ${fontSize};
    font-weight: bold;
  }
  .uc-note path {
    fill: ${tertiaryColor};
    stroke: ${primaryBorderColor};
  }
  .uc-note text {
    fill: ${primaryTextColor};
    font-family: ${fontFamily};
    font-size: 11px;
  }
  .uc-connector path {
    stroke: ${lineColor};
    fill: none;
  }
  .uc-connector text {
    fill: ${primaryTextColor};
    font-family: ${fontFamily};
    font-size: 10px;
    font-style: italic;
    font-weight: bold;
  }
  `;
};

export default getStyles;