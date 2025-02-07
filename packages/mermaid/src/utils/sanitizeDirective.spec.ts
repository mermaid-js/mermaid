import { sanitizeDirective } from './sanitizeDirective.js';

describe('sanitizeDirective - Theme Variable Validation', () => {
  it('should allow color names', () => {
    const input = { themeVariables: { mainBkg: 'green' } };
    sanitizeDirective(input);
    expect(input.themeVariables.mainBkg).toBe('green');
  });

  it('should allow hex colors', () => {
    const input = { themeVariables: { mainBkg: '#000', actorBkg: '#000000' } };
    sanitizeDirective(input);
    expect(input.themeVariables.mainBkg).toBe('#000');
    expect(input.themeVariables.actorBkg).toBe('#000000');
  });

  it('should allow rgb colors', () => {
    const input = { themeVariables: { mainBkg: 'rgb(0, 0, 0)', actorBkg: 'rgba(0, 0, 0, 0.5)' } };
    sanitizeDirective(input);
    expect(input.themeVariables.mainBkg).toBe('rgb(0, 0, 0)');
    expect(input.themeVariables.actorBkg).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('should allow hsl colors', () => {
    const input = {
      themeVariables: { mainBkg: 'hsl(0, 0%, 0%)', actorBkg: 'hsla(0, 0%, 0%, 0.5)' },
    };
    sanitizeDirective(input);
    expect(input.themeVariables.mainBkg).toBe('hsl(0, 0%, 0%)');
    expect(input.themeVariables.actorBkg).toBe('hsla(0, 0%, 0%, 0.5)');
  });

  it('should allow css variables', () => {
    const input = { themeVariables: { mainBkg: 'var(--my-color)' } };
    sanitizeDirective(input);
    expect(input.themeVariables.mainBkg).toBe('var(--my-color)');
  });

  it('should allow light-dark function', () => {
    const input = { themeVariables: { mainBkg: 'light-dark(green, blue)' } };
    sanitizeDirective(input);
    expect(input.themeVariables.mainBkg).toBe('light-dark(green, blue)');
  });

  it('should allow lighten and darken', () => {
    const input = { themeVariables: { mainBkg: 'lighten(darken(green, 10%), 10%)' } };
    sanitizeDirective(input);
    expect(input.themeVariables.mainBkg).toBe('lighten(darken(green, 10%), 10%)');
  });

  it('should allow relative color syntax', () => {
    const input = {
      themeVariables: {
        mainBkg: 'oklch(from var(--base-color) calc(l * 1.15) c h)',
        actorBkg: 'lch(from var(--base-color) calc(l + 20) c h)',
        actorBorder: 'lch(from var(--base-color) calc(l - 20) c h)',
        signalColor: 'rgb(from red r g b / alpha)',
      },
    };
    sanitizeDirective(input);
    expect(input.themeVariables.mainBkg).toBe('oklch(from var(--base-color) calc(l * 1.15) c h)');
    expect(input.themeVariables.actorBkg).toBe('lch(from var(--base-color) calc(l + 20) c h)');
    expect(input.themeVariables.actorBorder).toBe('lch(from var(--base-color) calc(l - 20) c h)');
    expect(input.themeVariables.signalColor).toBe('rgb(from red r g b / alpha)');
  });

  it('should set invalid input to empty string', () => {
    const input = { themeVariables: { mainBkg: '{}' } };
    sanitizeDirective(input);
    expect(input.themeVariables.mainBkg).toBe('');
  });

  it('should sanitize unsafe characters', () => {
    const input = { themeVariables: { mainBkg: '<script>alert("XSS")</script>' } };
    sanitizeDirective(input);
    expect(input.themeVariables.mainBkg).toBe('');
  });
});
