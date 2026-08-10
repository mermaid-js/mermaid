import { beforeEach, describe, it, expect } from 'vitest';
import * as configApi from '../../config.js';
import themes from '../../themes/index.js';
import getStyles from './styles.js';

describe('Wireframe Styles', () => {
  beforeEach(() => {
    configApi.setSiteConfig({});
  });

  describe('getStyles', () => {
    it('should generate default styles derived from theme variables', () => {
      const styles = getStyles();

      expect(styles).toContain('font-family: "trebuchet ms", verdana, arial, sans-serif');
      expect(styles).toContain('.wireframe-sketch');
      expect(styles).toContain('.wireframe-container');
    });

    it('should use theme variables when available', () => {
      const darkTheme = themes.dark.getThemeVariables();
      const styles = getStyles(darkTheme);

      expect(styles).toContain(`fill: ${darkTheme.mainBkg}`);
    });

    it('should allow valid custom font family and font size', () => {
      const styles = getStyles({
        fontFamily: 'Inter, sans-serif',
        fontSize: 18,
      });

      expect(styles).toContain('font-family: Inter, sans-serif');
      expect(styles).toContain('font-size: 18px');
    });

    it('should sanitize raw CSS injection attempts in color properties', () => {
      const maliciousStyles = getStyles({
        mainBkg: "red; } * { background: url('https://attacker.com/leak') }",
      });

      expect(maliciousStyles).not.toContain('attacker.com');
      expect(maliciousStyles).not.toContain('background: url');
      expect(maliciousStyles).toContain('fill: #ECECFF');
    });

    it('should sanitize raw CSS injection attempts in fontFamily property and fallback to corrected font family order', () => {
      const maliciousStyles = getStyles({
        fontFamily: "Comic Sans; } @import url('https://attacker.com/evil.css');",
      });

      expect(maliciousStyles).not.toContain('attacker.com');
      expect(maliciousStyles).not.toContain('@import');
      expect(maliciousStyles).toContain(
        "font-family: 'Comic Sans MS', 'Comic Neue', 'Chalkboard SE', cursive, sans-serif"
      );
    });

    it('should sanitize raw CSS injection attempts in fontSize property', () => {
      const maliciousStyles = getStyles({
        fontSize: '14px; } body { display: none }',
      });

      expect(maliciousStyles).not.toContain('display: none');
      expect(maliciousStyles).toContain('font-size: 14px');
    });

    it('should sanitize raw CSS injection in site config directive overrides', () => {
      configApi.updateSiteConfig({
        wireframe: {
          mainBkg: 'blue; } * { color: red }',
        } as any,
      });

      const styles = getStyles();
      expect(styles).not.toContain('color: red');
      expect(styles).toContain('fill: #ECECFF');
    });

    it('should output title bar dot CSS classes and allow custom dot color overrides', () => {
      const styles = getStyles({
        dotCloseColor: '#e11d48',
        dotMinimizeColor: '#f59e0b',
        dotMaximizeColor: '#10b981',
      });

      expect(styles).toContain('.wireframe-title-bar-dot-close');
      expect(styles).toContain('fill: #e11d48');
      expect(styles).toContain('.wireframe-title-bar-dot-minimize');
      expect(styles).toContain('fill: #f59e0b');
      expect(styles).toContain('.wireframe-title-bar-dot-maximize');
      expect(styles).toContain('fill: #10b981');
    });
  });
});
