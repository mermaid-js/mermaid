import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { applyOssHomeHeroNameClipClass, OSS_HOME_HERO_NAME_CLIP_CLASS } from './ossHeroClass.ts';

describe('ossHeroClass', () => {
  it('adds oss-home-name-clip to the hero name clip span when DOCS_HOSTNAME is not mermaid.ai', () => {
    const { window } = new JSDOM(`
      <div class="VPHomeHero">
        <div class="main">
          <h1 class="heading">
            <span class="name clip"><span class="home-header">Mermaid.js now lives</span></span>
          </h1>
        </div>
      </div>
    `);

    const added = applyOssHomeHeroNameClipClass({
      doc: window.document,
      hostname: 'mermaid.js.org',
      pathname: '/',
    });

    expect(added).toBe(1);
    expect(
      window.document.querySelector('.name.clip')?.classList.contains(OSS_HOME_HERO_NAME_CLIP_CLASS)
    ).toBe(true);
  });

  it('also adds the class for other non-mermaid.ai DOCS_HOSTNAME values (e.g. localhost)', () => {
    const { window } = new JSDOM(`
      <div class="VPHomeHero">
        <h1 class="heading"><span class="name clip">X</span></h1>
      </div>
    `);

    const added = applyOssHomeHeroNameClipClass({
      doc: window.document,
      hostname: 'localhost',
      pathname: '/',
    });

    expect(added).toBe(1);
    expect(
      window.document.querySelector('.name.clip')?.classList.contains(OSS_HOME_HERO_NAME_CLIP_CLASS)
    ).toBe(true);
  });

  it('does nothing when hostname is mermaid.ai', () => {
    const { window } = new JSDOM(`
      <div class="VPHomeHero">
        <h1 class="heading"><span class="name clip">X</span></h1>
      </div>
    `);

    const added = applyOssHomeHeroNameClipClass({
      doc: window.document,
      hostname: 'mermaid.ai',
      pathname: '/',
    });

    expect(added).toBe(0);
    expect(
      window.document.querySelector('.name.clip')?.classList.contains(OSS_HOME_HERO_NAME_CLIP_CLASS)
    ).toBe(false);
  });

  it('does nothing when hostname is a mermaid.ai subdomain', () => {
    const { window } = new JSDOM(`
      <div class="VPHomeHero">
        <h1 class="heading"><span class="name clip">X</span></h1>
      </div>
    `);

    const added = applyOssHomeHeroNameClipClass({
      doc: window.document,
      hostname: 'www.mermaid.ai',
      pathname: '/',
    });

    expect(added).toBe(0);
    expect(
      window.document.querySelector('.name.clip')?.classList.contains(OSS_HOME_HERO_NAME_CLIP_CLASS)
    ).toBe(false);
  });

  it('does nothing off the homepage path', () => {
    const { window } = new JSDOM(`
      <div class="VPHomeHero">
        <h1 class="heading"><span class="name clip">X</span></h1>
      </div>
    `);

    const added = applyOssHomeHeroNameClipClass({
      doc: window.document,
      hostname: 'mermaid.js.org',
      pathname: '/intro/',
    });

    expect(added).toBe(0);
  });

  it('is idempotent (does not report changes when class already exists)', () => {
    const { window } = new JSDOM(`
      <div class="VPHomeHero">
        <h1 class="heading"><span class="name clip">X</span></h1>
      </div>
    `);

    const first = applyOssHomeHeroNameClipClass({
      doc: window.document,
      hostname: 'mermaid.js.org',
      pathname: '/',
    });
    const second = applyOssHomeHeroNameClipClass({
      doc: window.document,
      hostname: 'mermaid.js.org',
      pathname: '/',
    });

    expect(first).toBe(1);
    expect(second).toBe(0);
  });
});
