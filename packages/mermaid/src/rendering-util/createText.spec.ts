import { describe, it, expect } from 'vitest';
import { replaceIconSubstring } from './createText.js';

describe('replaceIconSubstring', () => {
  it('converts FontAwesome icon notations to HTML tags', () => {
    const input = 'This is an icon: fa:fa-user and fab:fa-github';
    const output = replaceIconSubstring(input);
    const expected =
      "This is an icon: <i class='fa fa-user'></i> and <i class='fab fa-github'></i>";
    expect(output).toEqual(expected);
  });

  it('handles strings without FontAwesome icon notations', () => {
    const input = 'This string has no icons';
    const output = replaceIconSubstring(input);
    expect(output).toEqual(input); // No change expected
  });

  it('correctly processes multiple FontAwesome icon notations in one string', () => {
    const input = 'Icons galore: fa:fa-arrow-right, fak:fa-truck, fas:fa-home';
    const output = replaceIconSubstring(input);
    const expected =
      "Icons galore: <i class='fa fa-arrow-right'></i>, <i class='fak fa-truck'></i>, <i class='fas fa-home'></i>";
    expect(output).toEqual(expected);
  });

  it('correctly replaces a very long icon name with the fak prefix', () => {
    const input = 'Here is a long icon: fak:fa-truck-driving-long-winding-road in use';
    const output = replaceIconSubstring(input);
    const expected =
      "Here is a long icon: <i class='fak fa-truck-driving-long-winding-road'></i> in use";
    expect(output).toEqual(expected);
  });
});
