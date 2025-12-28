export function parseStyles(cssStyles: string[] | undefined): Record<string, string> {
  if (!cssStyles) {
    return {};
  }

  return cssStyles.reduce((seed, style) => {
    const [key, value] = style.split(':');
    // @ts-ignore The grammar should ensure that this is correct
    seed[key.trim()] = value.trim();
    return seed;
  }, {});
}

export function stringifyStyles(cssStyles: Record<string, string>): string {
  return Object.entries(cssStyles)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
}

export function concatenateStyles(cssStyles: string[]): string {
  return cssStyles.join(';');
}
