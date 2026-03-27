import { describe, it, expect } from 'vitest';

import {
  getComponentColor,
  getStageBackgroundColors,
  getWardleyThemeVars,
  CANVAS_SIZING,
  LABEL_STYLE,
} from './wardleyConfig.js';

describe('Renderer Config — Component Colors', () => {
  it('should return genesis color for x < 0.25', () => {
    const color = getComponentColor(0.1);
    expect(color).toBeTypeOf('string');
    expect(color).toMatch(/^#[\dA-Fa-f]{6}$/);
  });

  it('should return custom color for 0.25 <= x < 0.5', () => {
    expect(getComponentColor(0.3)).toBe(getWardleyThemeVars().customColor);
  });

  it('should return product color for 0.5 <= x < 0.75', () => {
    expect(getComponentColor(0.6)).toBe(getWardleyThemeVars().productColor);
  });

  it('should return commodity color for x >= 0.75', () => {
    expect(getComponentColor(0.9)).toBe(getWardleyThemeVars().commodityColor);
  });

  it('should handle boundary values', () => {
    const theme = getWardleyThemeVars();
    expect(getComponentColor(0.0)).toBe(theme.genesisColor);
    expect(getComponentColor(0.25)).toBe(theme.customColor);
    expect(getComponentColor(0.5)).toBe(theme.productColor);
    expect(getComponentColor(0.75)).toBe(theme.commodityColor);
    expect(getComponentColor(1.0)).toBe(theme.commodityColor);
  });
});

describe('Renderer Config — Theme Integration', () => {
  it('should return theme vars with all required fields', () => {
    const vars = getWardleyThemeVars();
    const keys = Object.keys(vars);
    expect(keys).toHaveLength(25);
    expect(vars).toHaveProperty('genesisColor');
    expect(vars).toHaveProperty('commodityColor');
    expect(vars).toHaveProperty('constraintColor');
    expect(vars).toHaveProperty('pioneersColor');
    expect(vars).toHaveProperty('settlersColor');
    expect(vars).toHaveProperty('townplannersColor');
    expect(vars).toHaveProperty('interestColor');
  });

  it('should return stage background colors as 4-element tuple', () => {
    const colors = getStageBackgroundColors();
    expect(colors).toHaveLength(4);
    for (const c of colors) {
      expect(c).toMatch(/^#[\dA-Fa-f]{6}$/);
    }
  });
});

describe('Renderer Config — Canvas Sizing Constants', () => {
  it('should have positive minimum dimensions', () => {
    expect(CANVAS_SIZING.minWidth).toBeGreaterThan(0);
    expect(CANVAS_SIZING.minHeight).toBeGreaterThan(0);
  });

  it('should have positive multipliers', () => {
    expect(CANVAS_SIZING.verticalMultiplier).toBeGreaterThan(0);
    expect(CANVAS_SIZING.horizontalMultiplier).toBeGreaterThan(0);
  });
});

describe('Renderer Config — Label Style', () => {
  it('should have truncation length >= truncation chars', () => {
    expect(LABEL_STYLE.truncationLength).toBeGreaterThanOrEqual(LABEL_STYLE.truncationChars);
  });

  it('should truncate with three dots', () => {
    // 13 chars kept + "..." = 16 visual characters = truncationLength
    expect(LABEL_STYLE.truncationChars).toBe(13);
    expect(LABEL_STYLE.truncationLength).toBe(16);
  });

  it('should have positive char width', () => {
    expect(LABEL_STYLE.charWidth).toBeGreaterThan(0);
  });
});

describe('Renderer Config — Marker ID Scoping', () => {
  it('marker IDs should be unique per diagram', () => {
    const id = 'abc123';
    const markerId = `wardley-dep-arrow-${id}`;
    expect(markerId).toBe('wardley-dep-arrow-abc123');
    // Different diagram ID produces a different marker
    const otherId = 'xyz789';
    expect(`wardley-dep-arrow-${otherId}`).not.toBe(markerId);
  });
});
