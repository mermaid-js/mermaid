import { describe, it, expect } from 'vitest';
import { getStyles } from './styles.js';

describe('Railroad Styles', () => {
  describe('getStyles', () => {
    it('should generate default styles when no options provided', () => {
      const styles = getStyles();

      expect(styles).toContain('font-family: monospace');
      expect(styles).toContain('font-size: 14px');
      expect(styles).toContain('.railroad-diagram');
      expect(styles).toContain('.railroad-terminal');
      expect(styles).toContain('.railroad-nonterminal');
      expect(styles).toContain('.railroad-line');
    });

    it('should use custom font family', () => {
      const styles = getStyles({ fontFamily: 'Arial' });

      expect(styles).toContain('font-family: Arial');
      expect(styles).not.toContain('font-family: monospace');
    });

    it('should use custom font size', () => {
      const styles = getStyles({ fontSize: 18 });

      expect(styles).toContain('font-size: 18px');
      expect(styles).not.toContain('font-size: 14px');
    });

    it('should use custom terminal colors', () => {
      const styles = getStyles({
        terminalFill: '#FF0000',
        terminalStroke: '#00FF00',
        terminalTextColor: '#0000FF',
      });

      expect(styles).toContain('fill: #FF0000');
      expect(styles).toContain('stroke: #00FF00');
      expect(styles).toContain('fill: #0000FF');
    });

    it('should use custom non-terminal colors', () => {
      const styles = getStyles({
        nonTerminalFill: '#AAAAAA',
        nonTerminalStroke: '#BBBBBB',
        nonTerminalTextColor: '#CCCCCC',
      });

      expect(styles).toContain('fill: #AAAAAA');
      expect(styles).toContain('stroke: #BBBBBB');
      expect(styles).toContain('fill: #CCCCCC');
    });

    it('should use custom line color and stroke width', () => {
      const styles = getStyles({
        lineColor: '#FF00FF',
        strokeWidth: 4,
      });

      expect(styles).toContain('stroke: #FF00FF');
      expect(styles).toContain('stroke-width: 4px');
    });

    it('should use custom marker fill', () => {
      const styles = getStyles({
        markerFill: '#123456',
      });

      expect(styles).toContain('fill: #123456');
    });

    it('should use custom comment colors', () => {
      const styles = getStyles({
        commentFill: '#F1F1F1',
        commentStroke: '#777777',
        commentTextColor: '#555555',
      });

      expect(styles).toContain('fill: #F1F1F1');
      expect(styles).toContain('stroke: #777777');
      expect(styles).toContain('fill: #555555');
    });

    it('should use custom special sequence colors', () => {
      const styles = getStyles({
        specialFill: '#E0E0FF',
        specialStroke: '#9900DD',
      });

      expect(styles).toContain('fill: #E0E0FF');
      expect(styles).toContain('stroke: #9900DD');
    });

    it('should use custom rule name color', () => {
      const styles = getStyles({
        ruleNameColor: '#990000',
      });

      expect(styles).toContain('fill: #990000');
    });

    it('should include all CSS classes', () => {
      const styles = getStyles();

      expect(styles).toContain('.railroad-terminal rect');
      expect(styles).toContain('.railroad-terminal text');
      expect(styles).toContain('.railroad-nonterminal rect');
      expect(styles).toContain('.railroad-nonterminal text');
      expect(styles).toContain('.railroad-line');
      expect(styles).toContain('.railroad-start circle');
      expect(styles).toContain('.railroad-end circle');
      expect(styles).toContain('.railroad-comment ellipse');
      expect(styles).toContain('.railroad-comment text');
      expect(styles).toContain('.railroad-special rect');
      expect(styles).toContain('.railroad-special text');
      expect(styles).toContain('.railroad-rule-name');
      expect(styles).toContain('.railroad-group');
    });

    it('should include special sequence stroke-dasharray', () => {
      const styles = getStyles();

      expect(styles).toContain('stroke-dasharray: 5,3');
    });

    it('should include comment text font-style italic', () => {
      const styles = getStyles();

      expect(styles).toContain('font-style: italic');
    });

    it('should include rule name font-weight bold', () => {
      const styles = getStyles();

      expect(styles).toContain('font-weight: bold');
    });

    it('should include text-anchor and dominant-baseline', () => {
      const styles = getStyles();

      expect(styles).toContain('text-anchor: middle');
      expect(styles).toContain('dominant-baseline: middle');
    });

    it('should handle all options at once', () => {
      const styles = getStyles({
        fontFamily: 'Courier',
        fontSize: 16,
        terminalFill: '#111111',
        terminalStroke: '#222222',
        terminalTextColor: '#333333',
        nonTerminalFill: '#444444',
        nonTerminalStroke: '#555555',
        nonTerminalTextColor: '#666666',
        lineColor: '#777777',
        strokeWidth: 3,
        markerFill: '#888888',
        commentFill: '#999999',
        commentStroke: '#AAAAAA',
        commentTextColor: '#BBBBBB',
        specialFill: '#CCCCCC',
        specialStroke: '#DDDDDD',
        ruleNameColor: '#EEEEEE',
      });

      expect(styles).toContain('font-family: Courier');
      expect(styles).toContain('font-size: 16px');
      expect(styles).toContain('fill: #111111');
      expect(styles).toContain('stroke: #222222');
      expect(styles).toContain('fill: #333333');
      expect(styles).toContain('fill: #444444');
      expect(styles).toContain('stroke: #555555');
      expect(styles).toContain('fill: #666666');
      expect(styles).toContain('stroke: #777777');
      expect(styles).toContain('stroke-width: 3px');
      expect(styles).toContain('fill: #888888');
      expect(styles).toContain('fill: #999999');
      expect(styles).toContain('stroke: #AAAAAA');
      expect(styles).toContain('fill: #BBBBBB');
      expect(styles).toContain('fill: #CCCCCC');
      expect(styles).toContain('stroke: #DDDDDD');
      expect(styles).toContain('fill: #EEEEEE');
    });
  });
});
