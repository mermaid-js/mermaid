// cspell:ignore usecase usecases usecasediagram usecaserenderer collab collabs colour bbox
const getStyles = (options: Record<string, string>): string => {
  const pColor = options.primaryColor ?? '#add8e6';
  const pText = options.primaryTextColor ?? '#000000';
  const pBorder = options.primaryBorderColor ?? pText;
  const fontFamily = options.fontFamily ?? 'Helvetica, Arial, sans-serif';
  const fontSize = options.fontSize ?? '12px';

  const sysFill = options.secondaryColor ?? '#daeef9';
  const noteFill = options.tertiaryColor ?? '#fffde7';
  const lineCol = options.lineColor ?? pBorder;

  return `
  .uc-actor circle {
    stroke-width: 1.5px;
  }
  .uc-actor line {
    stroke-width: 1.5px;
    fill:         none;
  }
  .uc-actor text {
    fill:        ${pText};
    font-family: ${fontFamily};
    font-size:   ${fontSize};
    font-weight: bold;
  }

  .uc-usecase ellipse {
    fill:         ${pColor};
    stroke:       ${pBorder};
    stroke-width: 1.2px;
  }
  .uc-usecase text {
    fill:        ${pText};
    font-family: ${fontFamily};
    font-size:   ${fontSize};
    font-weight: bold;
  }

  .uc-collaboration ellipse {
    fill:             none;
    stroke:           ${pBorder};
    stroke-dasharray: 6,4;
    stroke-width:     1.2px;
  }
  .uc-collaboration text {
    fill:        ${pText};
    font-family: ${fontFamily};
    font-size:   ${fontSize};
    font-weight: bold;
  }

  .uc-system rect {
    fill:         ${sysFill};
    stroke:       ${pBorder};
    stroke-width: 2px;
  }
  .uc-system text {
    fill:        ${pText};
    font-family: ${fontFamily};
    font-size:   16px;
    font-weight: bold;
  }

  .uc-external rect {
    fill:         ${pColor};
    stroke:       ${pBorder};
    stroke-width: 1.2px;
  }
  .uc-external text {
    fill:        ${pText};
    font-family: ${fontFamily};
    font-size:   ${fontSize};
    font-weight: bold;
  }

  .uc-note path {
    fill:         ${noteFill};
    stroke:       ${pBorder};
    stroke-width: 1.2px;
  }
  .uc-note text {
    fill:        ${pText};
    font-family: ${fontFamily};
    font-size:   11px;
    font-weight: bold;
  }

  .uc-connector path {
    stroke:       ${lineCol};
    stroke-width: 1.2px;
    fill:         none;
  }
  .uc-connector text {
    fill:        ${pText};
    font-family: ${fontFamily};
    font-size:   10px;
    font-weight: bold;
  }
  `;
};

export default getStyles;
