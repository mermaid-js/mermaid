import themes from './index.js';

describe('xychart theme variables', () => {
  it.each(Object.entries(themes))(
    '%s defaults legend text color to primary text color',
    (_name, themeProvider) => {
      const theme = themeProvider.getThemeVariables();

      expect(theme.xyChart.legendTextColor).toBe(theme.primaryTextColor);
    }
  );
});
