import { describe, expect, it } from 'vitest';
import { sanitizeText } from '../diagram-api/diagramAPI.js';
import mermaid from '../mermaid.js';
import { replaceIconSubstring } from './createText.js';

describe('replaceIconSubstring', () => {
  it('converts FontAwesome icon notations to HTML tags', async () => {
    const input = 'This is an icon: fa:fa-user and fab:fa-github';
    const output = await replaceIconSubstring(input);
    const expected = `This is an icon: <i class='fa fa-user'></i> and <i class='fab fa-github'></i>`;
    expect(output).toEqual(expected);
  });

  it('handles strings without FontAwesome icon notations', async () => {
    const input = 'This string has no icons';
    const output = await replaceIconSubstring(input);
    expect(output).toEqual(input); // No change expected
  });

  it('correctly processes multiple FontAwesome icon notations in one string', async () => {
    const input = 'Icons galore: fa:fa-arrow-right, fak:fa-truck, fas:fa-home';
    const output = await replaceIconSubstring(input);
    const expected = `Icons galore: <i class='fa fa-arrow-right'></i>, <i class='fak fa-truck'></i>, <i class='fas fa-home'></i>`;
    expect(output).toEqual(expected);
  });

  it('correctly replaces a very long icon name with the fak prefix', async () => {
    const input = 'Here is a long icon: fak:fa-truck-driving-long-winding-road in use';
    const output = await replaceIconSubstring(input);
    const expected =
      "Here is a long icon: <i class='fak fa-truck-driving-long-winding-road'></i> in use";
    expect(output).toEqual(expected);
  });

  it('correctly process the registered icons', async () => {
    /**
     *  CC-BY-4.0
     *  Copyright (c) Fonticons, Inc. - https://fontawesome.com/license/free
     *  https://fontawesome.com/icons/bell?f=classic&s=regular
     */
    const staticBellIconPack = {
      prefix: 'fa',
      icons: {
        bell: {
          body: '<path fill="currentColor" d="M224 0c-17.7 0-32 14.3-32 32v19.2C119 66 64 130.6 64 208v25.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416h400c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6c-28.3-35.5-43.8-79.6-43.8-125V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32m0 96c61.9 0 112 50.1 112 112v25.4c0 47.9 13.9 94.6 39.7 134.6H72.3c25.8-40 39.7-86.7 39.7-134.6V208c0-61.9 50.1-112 112-112m64 352H160c0 17 6.7 33.3 18.7 45.3S207 512 224 512s33.3-6.7 45.3-18.7S288 465 288 448"/>',
          width: 448,
        },
      },
      width: 512,
      height: 512,
    };
    mermaid.registerIconPacks([
      {
        name: 'fa',
        loader: () => Promise.resolve(staticBellIconPack),
      },
    ]);
    const input = 'Icons galore: fa:fa-bell';
    const output = await replaceIconSubstring(input);
    const expected = sanitizeText(staticBellIconPack.icons.bell.body);
    expect(output).toContain(expected);
  });
});
