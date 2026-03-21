// cspell:ignore usecase usecases usecasediagram
const getStyles = (options: Record<string, string>): string => {
  const fill   = options.fillType0  ?? '#61c1ed';
  const stroke = options.lineColor  ?? '#000000';
  const font   = options.fontFamily ?? 'Helvetica, Arial, sans-serif';
  const fontSize = options.fontSize ?? '12px';

  return `
  .usecase-diagram {
    /* ── diagram-local CSS variables ── */
    --uc-fill:        ${fill};
    --uc-stroke:      ${stroke};
    --uc-system-fill: #e8f4fb;
    --uc-font:        ${font};
    --uc-font-size:   ${fontSize};
  }

  /* ── shared label style ── */
  .usecase-diagram .uc-label {
    font-family: var(--uc-font);
    font-size:   var(--uc-font-size);
    font-weight: bold;
    fill:        #000;
  }

  /* ── actor label sits below the figure ── */
  .usecase-diagram .uc-actor-label {
    font-size: 12px;
  }

  /* ── system boundary title ── */
  .usecase-diagram .uc-system-label {
    font-family: var(--uc-font);
    font-size:   18px;
    font-weight: bold;
    fill:        #000;
  }

  /* ── «include» / «extend» stereotype labels on curves ── */
  .usecase-diagram .uc-rel-label {
    font-family: var(--uc-font);
    font-size:   10px;
    font-style:  italic;
    font-weight: bold;
    fill:        #000;
    text-anchor: start;
  }
  `;
};

export default getStyles;
