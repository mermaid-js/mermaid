import { getThemeVariables } from './theme-dark.js';

describe('theme-dark', () => {
  describe('gantt chart colors', () => {
    it('should have dark taskTextDarkColor that contrasts with light doneTaskBkgColor', () => {
      const theme = getThemeVariables();

      // taskTextDarkColor is used for done-task text over doneTaskBkgColor (lightgrey).
      // It must be a dark color for readable contrast.
      const color = theme.taskTextDarkColor;
      expect(color).toBeDefined();

      // Positive assertion: the computed value should be a dark hex color.
      // invert('lightgrey') produces '#2c2c2c'.
      expect(color).toBe('#2c2c2c');
    });
  });

  describe('pie chart colors', () => {
    it('should have light pieTitleTextColor readable on dark background', () => {
      const theme = getThemeVariables();

      // Pie title text sits on the dark diagram background (#333).
      // It must be a light color, not derived from the (now dark) taskTextDarkColor.
      expect(theme.pieTitleTextColor).toBe('lightgrey');
    });

    it('should have light pieLegendTextColor readable on dark background', () => {
      const theme = getThemeVariables();

      expect(theme.pieLegendTextColor).toBe('lightgrey');
    });
  });
});
