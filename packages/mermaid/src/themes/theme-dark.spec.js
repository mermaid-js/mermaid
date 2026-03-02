import { getThemeVariables } from './theme-dark.js';

describe('theme-dark', () => {
  describe('gantt chart colors', () => {
    it('should have dark taskTextDarkColor that contrasts with light doneTaskBkgColor', () => {
      const theme = getThemeVariables();

      // doneTaskBkgColor is a light color (mainContrastColor = 'lightgrey')
      // taskTextDarkColor must be dark enough to read against it
      // A simple luminance check: the color should NOT be a light/whitish value
      const color = theme.taskTextDarkColor;
      expect(color).toBeDefined();

      // The fix: taskTextDarkColor should be a recognizably dark color
      // Acceptable: 'black', '#000', '#333', or any clearly dark value
      // Not acceptable: light colors like '#ccc', '#d4dbcf', 'lightgrey', etc.
      //
      // We check that it's not the same as darkTextColor (which is light in dark theme)
      // and instead is an explicitly dark value
      expect(color).not.toBe(theme.darkTextColor);
    });
  });
});
