import { describe, it, expect } from 'vitest';
import { replaceIconSubstring } from './createText.js';
import { icon } from '@fortawesome/fontawesome-svg-core';
import { faUser, faArrowRight, faHome } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

describe('replaceIconSubstring', () => {
  it('converts FontAwesome icon notations to HTML tags', () => {
    const input = 'This is an icon: fa:fa-user and fab:fa-github';
    const output = replaceIconSubstring(input);
    const expected = `This is an icon: ${icon(faUser).html.join('')} and ${icon(faGithub).html.join('')}`;
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
    const expected = `Icons galore: ${icon(faArrowRight).html.join()}, <i class='fak fa-truck'></i>, ${icon(faHome).html.join()}`;
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
