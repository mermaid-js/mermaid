import { adjust } from 'khroma';

export const mkBorder = (col, darkMode) =>
  darkMode ? adjust(col, { s: -40, l: 10 }) : adjust(col, { s: -40, l: -10 });

/**
 * Build the per-category fill/stroke palette for the neuralnet diagram.
 *
 * Returns `nn*Fill` and `nn*Stroke` entries per layer category. Themes apply
 * these as theme variables (with `||` fallback) so users can override any
 * single colour and so light/dark themes get tuned defaults. The renderer
 * reads these from `themeVariables`.
 *
 * @param {boolean} darkMode - whether the active theme is dark
 * @returns {Record<string, string>} flat map of neuralnet theme variables
 */
export const getNeuralnetPalette = (darkMode) => {
  // Saturated category hues that read well on both light and dark canvases.
  // Dark mode slightly lifts lightness so fills don't disappear on a dark bg.
  const lift = darkMode ? 8 : 0;
  const base = {
    Input: '#4A90D9',
    Output: '#27AE60',
    Dense: '#8E44AD',
    Conv: '#E67E22',
    Pool: '#16A085',
    Norm: '#F39C12',
    Dropout: '#95A5A6',
    Structural: darkMode ? '#34495E' : '#BDC3C7',
    Recurrent: '#C0392B',
    Merge: '#1ABC9C',
    Attention: '#2980B9',
    Activation: darkMode ? '#2C3E50' : '#D5D8DC',
  };
  const palette = {};
  for (const [name, hex] of Object.entries(base)) {
    const fill = lift ? adjust(hex, { l: lift }) : hex;
    palette[`nn${name}Fill`] = fill;
    palette[`nn${name}Stroke`] = adjust(fill, { l: -12 });
  }
  return palette;
};
