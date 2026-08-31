import { darken, lighten, isDark } from 'khroma';
import { getConfig } from './../../config.js';
import { colorSlotCount, isColorTheme as isPaletteTheme } from '../common/colorThemeGate.js';

const genReduxSections = (options) => {
  const { theme } = getConfig();
  //Required to read the active theme at render time,
  // since options alone does not expose the theme name needed to switch between redux and classic section generators.
  const isDarkTheme = theme?.includes('dark');
  // Use the shared gate rather than substring-matching the theme name. It checks both
  // halves: that this is a colour theme, and that a palette is actually present. Both
  // matter -- `includes('color')` would also match any future theme whose name merely
  // contains "color", and it says nothing about the palette, so indexing
  // `borderColorArray` off a name-only check threw when the configured theme and the
  // passed-in `options` disagreed.
  const isColorTheme = isPaletteTheme(theme, options.borderColorArray);
  const rawSvgId = options.svgId?.replace(/^#/, '') ?? '';
  const scopedDropShadow = rawSvgId
    ? `url(#${rawSvgId}-drop-shadow)`
    : (options.dropShadow ?? 'none');

  let sections = '';

  for (let i = 0; i < colorSlotCount(options.THEME_COLOR_LIMIT); i++) {
    const sw = `${17 - 3 * i}`;
    // Unlike `er`/`requirement`, the bound here is the section count, not the palette
    // length: timeline numbers `.section-N` classes, which are not `data-color-id` slots
    // and so are not bounded by what anything stamps. The palette therefore wraps across
    // however many sections exist -- indexing raw would leave the overflow sections
    // undefined.
    const slot = isColorTheme
      ? options.borderColorArray[i % options.borderColorArray.length]
      : undefined;
    const color = slot ?? options.mainBkg;
    const stroke = slot ?? options.nodeBorder;

    sections += `
    .section-${i - 1} rect,
    .section-${i - 1} path,
    .section-${i - 1} circle {
      fill: ${isDarkTheme && isColorTheme ? options.mainBkg : color};
      stroke: ${stroke};
      stroke-width: ${options.strokeWidth};
      filter: ${scopedDropShadow};
    }

    .section-${i - 1} text {
      fill: ${options.nodeBorder};
      font-weight: ${options.fontWeight}
    }

    .node-icon-${i - 1} {
      font-size: 40px;
      color: ${options['cScaleLabel' + i]};
    }

    .section-edge-${i - 1} {
      stroke: ${options['cScale' + i]};
    }

    .edge-depth-${i - 1} {
      stroke-width: ${sw};
    }

    .section-${i - 1} line {
      stroke: ${options['cScaleInv' + i]};
      stroke-width: 3;
    }

    .lineWrapper line {
      stroke: ${options.nodeBorder};
      stroke-width:${options.strokeWidth}
    }

    .disabled,
    .disabled circle,
    .disabled text {
      fill: ${options.tertiaryColor ?? 'lightgray'};
    }

    .disabled text {
      fill: ${options.clusterBorder ?? '#efefef'};
    }
    `;
  }

  return sections;
};

const genSections = (options) => {
  let sections = '';

  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    options['lineColor' + i] = options['lineColor' + i] || options['cScaleInv' + i];
    if (isDark(options['lineColor' + i])) {
      options['lineColor' + i] = lighten(options['lineColor' + i], 20);
    } else {
      options['lineColor' + i] = darken(options['lineColor' + i], 20);
    }
  }

  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    const sw = '' + (17 - 3 * i);
    sections += `
    .section-${i - 1} rect, .section-${i - 1} path, .section-${i - 1} circle, .section-${
      i - 1
    } path  {
      fill: ${options['cScale' + i]};
    }
    .section-${i - 1} text {
     fill: ${options['cScaleLabel' + i]};
    }
    .node-icon-${i - 1} {
      font-size: 40px;
      color: ${options['cScaleLabel' + i]};
    }
    .section-edge-${i - 1}{
      stroke: ${options['cScale' + i]};
    }
    .edge-depth-${i - 1}{
      stroke-width: ${sw};
    }
    .section-${i - 1} line {
      stroke: ${options['cScaleInv' + i]} ;
      stroke-width: 3;
    }

    .lineWrapper line{
      stroke: ${options['cScaleLabel' + i]} ;
    }

    .disabled, .disabled circle, .disabled text {
      fill: ${options.tertiaryColor ?? 'lightgray'};
    }
    .disabled text {
      fill: ${options.clusterBorder ?? '#efefef'};
    }
    `;
  }
  return sections;
};

const getStyles = (options) => {
  // Required to read the active theme at render time, since options alone does not expose the theme name needed to switch between redux and classic section generators.
  const { theme } = getConfig();
  const isReduxTheme = theme?.includes('redux');
  const isNeutralTheme = theme === 'neutral';
  // options.svgId is the CSS selector (e.g. '#mermaid-0'), strip the leading '#' for use in url(#...)
  const rawSvgId = options.svgId?.replace(/^#/, '') ?? '';
  let gradientSections = '';
  // Don't apply gradient styling for neutral theme - it should maintain its grayscale color scheme
  if (options.useGradient && rawSvgId && options.THEME_COLOR_LIMIT && !isNeutralTheme) {
    for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
      gradientSections += `
      .section-${i - 1}[data-look="neo"] rect,
      .section-${i - 1}[data-look="neo"] path,
      .section-${i - 1}[data-look="neo"] circle {
        fill: ${options.mainBkg};
        stroke: url(#${rawSvgId}-gradient);
        stroke-width: 2;
      }
      .section-${i - 1}[data-look="neo"] line {
        stroke: url(#${rawSvgId}-gradient);
        stroke-width: 2;
      }`;
    }
  }

  return `
  .edge {
    stroke-width: 3;
  }
  ${isReduxTheme ? genReduxSections(options) : genSections(options)}
  ${gradientSections}
  .section-root rect, .section-root path, .section-root circle  {
    fill: ${options.git0};
  }
  .section-root text {
    fill: ${options.gitBranchLabel0};
  }
  .icon-container {
    height:100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .edge {
    fill: none;
  }
  .eventWrapper  {
   filter: brightness(120%);
  }
`;
};
export default getStyles;
