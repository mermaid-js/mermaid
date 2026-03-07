import { assert, beforeEach, describe, expect, it, vi } from 'vitest';

import assignWithDepth from './assignWithDepth.js';
import type { MermaidConfig } from './config.type.js';
import mermaid from './mermaid.js';
import mermaidAPI, {
  appendDivSvgG,
  cleanUpSvgCode,
  createCssStyles,
  createUserStyles,
  putIntoIFrame,
  removeExistingElements,
} from './mermaidAPI.js';
import * as configApi from './config.js';

// --------------
// Mocks
//   To mock a module, first define a mock for it, then (if used explicitly in the tests) import it. Be sure the path points to exactly the same file as is imported in mermaidAPI (the module being tested)
vi.mock('./styles.js', () => {
  return {
    addStylesForDiagram: vi.fn(),
    default: vi.fn().mockReturnValue(' .userStyle { font-weight:bold; }'),
  };
});

import getStyles from './styles.js';

vi.mock('stylis', () => {
  return {
    stringify: vi.fn(),
    compile: vi.fn(),
    serialize: vi.fn().mockReturnValue('stylis serialized css'),
  };
});

import { compile, serialize } from 'stylis';
import { Diagram } from './Diagram.js';
import { ClassDB } from './diagrams/class/classDb.js';
import { FlowDB } from './diagrams/flowchart/flowDb.js';
import { SequenceDB } from './diagrams/sequence/sequenceDb.js';
import { decodeEntities, encodeEntities } from './utils.js';
import { toBase64 } from './utils/base64.js';
import { StateDB } from './diagrams/state/stateDb.js';
import { ensureNodeFromSelector, jsdomIt } from './tests/util.js';
import { JSDOM } from 'jsdom';

/**
 * @see https://vitest.dev/guide/mocking.html Mock part of a module
 * To investigate how to mock just some methods from a module - call the actual implementation and then mock others, e.g. so they can be spied on
 */

// -------------------------------------------------------------------------------------
describe('mermaidAPI', () => {
  describe('encodeEntities', () => {
    it('removes the ending ; from style [text1]:[optional word]#[text2]; with ', () => {
      const text = 'style this; is ; everything :something#not-nothing; and this too;';
      expect(encodeEntities(text)).toEqual(
        'style this; is ; everything :something#not-nothing; and this too'
      );
    });
    it('removes the ending ; from classDef [text1]:[optional word]#[text2]; with ', () => {
      const text = 'classDef this; is ; everything :something#not-nothing; and this too;';
      expect(encodeEntities(text)).toEqual(
        'classDef this; is ; everything :something#not-nothing; and this too'
      );
    });

    describe('replaces words starting with # and ending with ;', () => {
      const testStr = 'Hello #there;';

      it('removes the #', () => {
        const result = encodeEntities(testStr);
        expect(result.substring(0, 7)).toEqual('Hello ﬂ');
      });

      it('prefix is ﬂ°° if is all digits', () => {
        const result = encodeEntities('Hello #77653;');
        expect(result.substring(6, result.length)).toEqual('ﬂ°°77653¶ß');
      });

      it('prefix is ﬂ° if is not all digits', () => {
        const result = encodeEntities(testStr);
        expect(result.substring(6, result.length)).toEqual('ﬂ°there¶ß');
      });
      it('always removes the semi-colon and ends with ¶ß', () => {
        const result = encodeEntities(testStr);
        expect(result.substring(result.length - 2, result.length)).toEqual('¶ß');
      });
    });

    it('does all the replacements on the given text', () => {
      const text =
        'style this; is ; everything :something#not-nothing; and this too; \n' +
        'classDef this; is ; everything :something#not-nothing; and this too; \n' +
        'Hello #there; #andHere;#77653;';

      const result = encodeEntities(text);
      expect(result).toEqual(
        'style this; is ; everything :something#not-nothing; and this too \n' +
          'classDef this; is ; everything :something#not-nothing; and this too \n' +
          'Hello ﬂ°there¶ß ﬂ°andHere¶ßﬂ°°77653¶ß'
      );
    });
  });

  describe('decodeEntities', () => {
    it('replaces ﬂ°° with &#', () => {
      expect(decodeEntities('ﬂ°°hﬂ°°iﬂ°°')).toEqual('&#h&#i&#');
    });
    it('replaces ﬂ° with &', () => {
      expect(decodeEntities('ﬂ°hﬂ°iﬂ°')).toEqual('&h&i&');
    });
    it('replaces ¶ß with ;', () => {
      expect(decodeEntities('¶ßh¶ßi¶ß')).toEqual(';h;i;');
    });
    it('runs all the replacements on the given text', () => {
      expect(decodeEntities('¶ßﬂ°¶ßﬂ°°¶ß')).toEqual(';&;&#;');
    });
  });

  describe('cleanUpSvgCode', () => {
    it('replaces marker end URLs with just the anchor if not sandboxed and not useMarkerUrls', () => {
      const markerFullUrl = 'marker-end="url(some-URI#that)"';
      let useArrowMarkerUrls = false;
      let isSandboxed = false;
      let result = cleanUpSvgCode(markerFullUrl, isSandboxed, useArrowMarkerUrls);
      expect(result).toEqual('marker-end="url(#that)"');

      useArrowMarkerUrls = true;
      result = cleanUpSvgCode(markerFullUrl, isSandboxed, useArrowMarkerUrls);
      expect(result).toEqual(markerFullUrl); // not changed

      useArrowMarkerUrls = false;
      isSandboxed = true;
      result = cleanUpSvgCode(markerFullUrl, isSandboxed, useArrowMarkerUrls);
      expect(result).toEqual(markerFullUrl); // not changed
    });

    it('decodesEntities', () => {
      // cspell:ignore brrrr
      const result = cleanUpSvgCode('¶ß brrrr', true, true);
      expect(result).toEqual('; brrrr');
    });

    it('replaces old style br tags with new style', () => {
      const result = cleanUpSvgCode('<br> brrrr<br>', true, true);
      expect(result).toEqual('<br/> brrrr<br/>');
    });
  });

  describe('putIntoIFrame', () => {
    const inputSvgCode = 'this is the SVG code ⛵';

    it('uses the default SVG iFrame height is used if no svgElement given', () => {
      const result = putIntoIFrame(inputSvgCode);
      expect(result).toMatch(/style="(.*)height:100%(.*);"/);
    });
    it('default style attributes are: width: 100%, height: 100%, border: 0, margin: 0', () => {
      const result = putIntoIFrame(inputSvgCode);
      expect(result).toMatch(/style="(.*)width:100%(.*);"/);
      expect(result).toMatch(/style="(.*)height:100%(.*);"/);
      expect(result).toMatch(/style="(.*)border:0(.*);"/);
      expect(result).toMatch(/style="(.*)margin:0(.*);"/);
    });
    it('sandbox="allow-top-navigation-by-user-activation allow-popups">', () => {
      const result = putIntoIFrame(inputSvgCode);
      expect(result).toMatch(/sandbox="allow-top-navigation-by-user-activation allow-popups">/);
    });
    it('msg shown is "The "iframe" tag is not supported by your browser.\\n" if iFrames are not supported in the browser', () => {
      const result = putIntoIFrame(inputSvgCode);
      expect(result).toMatch(/\s*The "iframe" tag is not supported by your browser\./);
    });

    it('sets src to base64 version of <body style="IFRAME_SVG_BODY_STYLE">svgCode<//body>', () => {
      const base64encodedSrc = toBase64(`<body style="margin:0">${inputSvgCode}</body>`);
      const expectedSrc = `src="data:text/html;charset=UTF-8;base64,${base64encodedSrc}"`;
      const result = putIntoIFrame(inputSvgCode);
      expect(result).toContain(expectedSrc);
    });

    it('uses the height and appends px from the svgElement given', () => {
      const faux_svgElement = {
        viewBox: {
          baseVal: {
            height: 42,
          },
        },
      };

      const result = putIntoIFrame(inputSvgCode, faux_svgElement);
      expect(result).toMatch(/style="(.*)height:42px;/);
    });
  });

  describe('appendDivSvgG', () => {
    // cspell:ignore dthe

    jsdomIt('appends a div node', ({ body }) => {
      appendDivSvgG(body, 'theId', 'dtheId');
      const divNode = ensureNodeFromSelector('div');
      const svgNode = ensureNodeFromSelector('svg', divNode);
      ensureNodeFromSelector('g', svgNode);
    });
    jsdomIt('the id for the div is "d" with the id appended', ({ body }) => {
      appendDivSvgG(body, 'theId', 'dtheId');
      const divNode = ensureNodeFromSelector('div');
      expect(divNode?.getAttribute('id')).toBe('dtheId');
    });

    jsdomIt('sets the style for the div if one is given', ({ body }) => {
      appendDivSvgG(body, 'theId', 'dtheId', 'given div style', 'given x link');
      const divNode = ensureNodeFromSelector('div');
      expect(divNode?.getAttribute('style')).toBe('given div style');
    });

    jsdomIt('sets the svg width to 100%', ({ body }) => {
      appendDivSvgG(body, 'theId', 'dtheId');
      const svgNode = ensureNodeFromSelector('div > svg');
      expect(svgNode.getAttribute('width')).toBe('100%');
    });
    jsdomIt('the svg id is the id', ({ body }) => {
      appendDivSvgG(body, 'theId', 'dtheId');
      const svgNode = ensureNodeFromSelector('div > svg');
      expect(svgNode.getAttribute('id')).toBe('theId');
    });
    jsdomIt('the svg xml namespace is the 2000 standard', ({ body }) => {
      appendDivSvgG(body, 'theId', 'dtheId');
      const svgNode = ensureNodeFromSelector('div > svg');
      expect(svgNode.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    });
    jsdomIt('sets the  svg xlink if one is given', ({ body }) => {
      appendDivSvgG(body, 'theId', 'dtheId', 'div style', 'given x link');
      const svgNode = ensureNodeFromSelector('div > svg');
      expect(svgNode.getAttribute('xmlns:xlink')).toBe('given x link');
    });
    jsdomIt('returns the given parentRoot d3 nodes', ({ body }) => {
      expect(appendDivSvgG(body, 'theId', 'dtheId')).toEqual(body);
    });
  });

  describe('createCssStyles', () => {
    const serif = 'serif';
    const sansSerif = 'sans-serif';
    const mocked_config_with_htmlLabels: MermaidConfig = {
      themeCSS: 'default',
      fontFamily: serif,
      altFontFamily: sansSerif,
      htmlLabels: true,
    };

    it('gets the cssStyles from the theme', () => {
      const styles = createCssStyles(mocked_config_with_htmlLabels, null);
      expect(styles).toMatch(/^\ndefault(.*)/);
    });
    it('gets the fontFamily from the config', () => {
      const styles = createCssStyles(mocked_config_with_htmlLabels, new Map());
      expect(styles).toMatch(/(.*)\n:root { --mermaid-font-family: serif(.*)/);
    });
    it('gets the alt fontFamily from the config', () => {
      const styles = createCssStyles(mocked_config_with_htmlLabels, undefined);
      expect(styles).toMatch(/(.*)\n:root { --mermaid-alt-font-family: sans-serif(.*)/);
    });

    describe('there are some classDefs', () => {
      const classDef1 = { id: 'classDef1', styles: ['style1-1', 'style1-2'], textStyles: [] };
      const classDef2 = { id: 'classDef2', styles: [], textStyles: ['textStyle2-1'] };
      const classDef3 = { id: 'classDef3', textStyles: ['textStyle3-1', 'textStyle3-2'] };
      const classDefs = { classDef1, classDef2, classDef3 };

      describe('the graph supports classDefs', () => {
        const REGEXP_SPECIALS = ['^', '$', '?', '(', '{', '[', '.', '*', '!'];

        // prefix any special RegExp characters in the given string with a \ so we can use the literal character in a RegExp
        function escapeForRegexp(str: string) {
          const strChars = [...str]; // split into array of every char
          const strEscaped = strChars.map((char) => {
            if (REGEXP_SPECIALS.includes(char)) {
              return `\\${char}`;
            } else {
              return char;
            }
          });
          return strEscaped.join('');
        }

        // Common test expecting given styles to have .classDef1 and .classDef2 statements but not .classDef3
        function expect_styles_matchesHtmlElements(styles: string, htmlElement: string) {
          expect(styles).toMatch(
            new RegExp(
              `\\.classDef1 ${escapeForRegexp(
                htmlElement
              )} \\{ style1-1 !important; style1-2 !important; }`
            )
          );
          // no CSS styles are created if there are no styles for a classDef
          expect(styles).not.toMatch(
            new RegExp(`\\.classDef2 ${escapeForRegexp(htmlElement)} \\{ style(.*) !important; }`)
          );
          expect(styles).not.toMatch(
            new RegExp(`\\.classDef3 ${escapeForRegexp(htmlElement)} \\{ style(.*) !important; }`)
          );
        }

        // Common test expecting given textStyles to have .classDef2 and .classDef3 statements but not .classDef1
        function expect_textStyles_matchesHtmlElements(textStyles: string, htmlElement: string) {
          expect(textStyles).toMatch(
            new RegExp(
              `\\.classDef2 ${escapeForRegexp(htmlElement)} \\{ textStyle2-1 !important; }`
            )
          );
          expect(textStyles).toMatch(
            new RegExp(
              `\\.classDef3 ${escapeForRegexp(
                htmlElement
              )} \\{ textStyle3-1 !important; textStyle3-2 !important; }`
            )
          );

          // no CSS styles are created if there are no textStyles for a classDef
          expect(textStyles).not.toMatch(
            new RegExp(
              `\\.classDef1 ${escapeForRegexp(htmlElement)} \\{ textStyle(.*) !important; }`
            )
          );
        }

        // common suite and tests to verify that the right styles are created with the right htmlElements
        function expect_correct_styles_with_htmlElements(mocked_config: MermaidConfig) {
          describe('creates styles for "> *" and  "span" elements', () => {
            const htmlElements = ['> *', 'span'];

            it('creates CSS styles for every style and textStyle in every classDef', () => {
              // @todo TODO Can't figure out how to spy on the cssImportantStyles method.
              //   That would be a much better approach than manually checking the result

              const styles = createCssStyles(mocked_config, new Map(Object.entries(classDefs)));
              htmlElements.forEach((htmlElement) => {
                expect_styles_matchesHtmlElements(styles, htmlElement);
              });
              expect_textStyles_matchesHtmlElements(styles, 'tspan');
            });
          });
        }

        it('there are htmlLabels in the configuration', () => {
          expect_correct_styles_with_htmlElements(mocked_config_with_htmlLabels);
        });

        it('there are flowchart.htmlLabels in the configuration', () => {
          const mocked_config_flowchart_htmlLabels: MermaidConfig = {
            themeCSS: 'default',
            fontFamily: 'serif',
            altFontFamily: 'sans-serif',
            flowchart: {
              htmlLabels: true,
            },
          };
          expect_correct_styles_with_htmlElements(mocked_config_flowchart_htmlLabels);
        });

        describe('no htmlLabels in the configuration', () => {
          const mocked_config_no_htmlLabels: MermaidConfig = {
            themeCSS: 'default',
            fontFamily: 'serif',
            altFontFamily: 'sans-serif',
            htmlLabels: false, // Explicitly set to false
          };

          describe('creates styles for shape elements "rect", "polygon", "ellipse", and "circle"', () => {
            const htmlElements = ['rect', 'polygon', 'ellipse', 'circle'];

            it('creates CSS styles for every style and textStyle in every classDef', () => {
              // TODO Can't figure out how to spy on the cssImportantStyles method. That would be a much better approach than manually checking the result.

              const styles = createCssStyles(
                mocked_config_no_htmlLabels,
                new Map(Object.entries(classDefs))
              );
              htmlElements.forEach((htmlElement) => {
                expect_styles_matchesHtmlElements(styles, htmlElement);
              });
              expect_textStyles_matchesHtmlElements(styles, 'tspan');
            });
          });
        });
      });
    });
  });

  describe('createUserStyles', () => {
    const mockConfig = {
      themeCSS: 'default',
      htmlLabels: true,
      themeVariables: { fontFamily: 'serif' },
    };

    const classDef1 = { id: 'classDef1', styles: ['style1-1'], textStyles: [] };

    it('gets the css styles created', () => {
      // @todo TODO if a single function in the module can be mocked, do it for createCssStyles and mock the results.

      createUserStyles(mockConfig, 'flowchart-v2', new Map([['classDef1', classDef1]]), 'someId');
      const expectedStyles =
        '\ndefault' +
        '\n.classDef1 > * { style1-1 !important; }' +
        '\n.classDef1 span { style1-1 !important; }';
      expect(getStyles).toHaveBeenCalledWith('flowchart-v2', expectedStyles, {
        fontFamily: 'serif',
      });
    });

    it('calls getStyles to get css for all graph, user css styles, and config theme variables', () => {
      createUserStyles(mockConfig, 'someDiagram', new Map(), 'someId');
      expect(getStyles).toHaveBeenCalled();
    });

    it('returns the result of compiling, stringifying, and serializing the css code with stylis', () => {
      const result = createUserStyles(mockConfig, 'someDiagram', new Map(), 'someId');
      expect(compile).toHaveBeenCalled();
      expect(serialize).toHaveBeenCalled();
      expect(result).toEqual('stylis serialized css');
    });
  });

  describe('removeExistingElements', () => {
    const svgId = 'svgId';
    const tempDivId = 'tempDivId';
    const tempIframeId = 'tempIFrameId';
    const givenDocument = new Document();
    const rootHtml = givenDocument.createElement('html');
    givenDocument.append(rootHtml);

    const svgElement = givenDocument.createElement('svg'); // doesn't matter what the tag is in the test
    svgElement.id = svgId;
    const tempDivElement = givenDocument.createElement('div'); // doesn't matter what the tag is in the test
    tempDivElement.id = tempDivId;
    const tempiFrameElement = givenDocument.createElement('iframe'); // doesn't matter what the tag is in the test
    tempiFrameElement.id = tempIframeId;

    it('removes an existing element with given id', () => {
      rootHtml.appendChild(svgElement);
      rootHtml.append(tempDivElement);
      rootHtml.append(tempiFrameElement);

      expect(givenDocument.getElementById(svgElement.id)).toEqual(svgElement);
      expect(givenDocument.getElementById(tempDivElement.id)).toEqual(tempDivElement);
      expect(givenDocument.getElementById(tempiFrameElement.id)).toEqual(tempiFrameElement);
      removeExistingElements(givenDocument, svgId, tempDivId, tempIframeId);
      expect(givenDocument.getElementById(svgElement.id)).toBeNull();
      expect(givenDocument.getElementById(tempDivElement.id)).toBeNull();
      expect(givenDocument.getElementById(tempiFrameElement.id)).toBeNull();
    });

    it('removes an existing iframe element even if div element is absent', () => {
      tempiFrameElement.append(svgElement);
      rootHtml.append(tempiFrameElement);

      expect(givenDocument.getElementById(tempIframeId)).toEqual(tempiFrameElement);
      expect(givenDocument.getElementById(tempDivId)).toBeNull();
      expect(givenDocument.getElementById(svgId)).toEqual(svgElement);
      removeExistingElements(givenDocument, svgId, tempDivId, tempIframeId);
      expect(givenDocument.getElementById(tempDivId)).toBeNull();
      expect(givenDocument.getElementById(tempIframeId)).toBeNull();
      expect(givenDocument.getElementById(svgId)).toBeNull();
    });

    it('removes both existing div and iframe elements when both are present', () => {
      tempDivElement.append(svgElement);
      rootHtml.append(tempDivElement);
      rootHtml.append(tempiFrameElement);

      expect(givenDocument.getElementById(tempIframeId)).toEqual(tempiFrameElement);
      expect(givenDocument.getElementById(tempDivId)).toEqual(tempDivElement);
      expect(givenDocument.getElementById(svgId)).toEqual(svgElement);
      removeExistingElements(givenDocument, svgId, tempDivId, tempIframeId);
      expect(givenDocument.getElementById(tempIframeId)).toBeNull();
      expect(givenDocument.getElementById(tempDivId)).toBeNull();
      expect(givenDocument.getElementById(svgId)).toBeNull();
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
      mermaidAPI.globalReset();
    });

    it('copies a literal into the configuration', () => {
      const orgConfig: any = mermaidAPI.getConfig();
      expect(orgConfig.testLiteral).toBe(undefined);

      const testConfig: any = { testLiteral: true };

      mermaidAPI.initialize(testConfig);
      const config: any = mermaidAPI.getConfig();

      expect(config.testLiteral).toBe(true);
    });

    it('copies an object into the configuration', () => {
      const orgConfig: any = mermaidAPI.getConfig();
      expect(orgConfig.testObject).toBe(undefined);

      const object = {
        test1: 1,
        test2: false,
      };

      const testConfig: any = { testObject: object };

      mermaidAPI.initialize(testConfig);

      let config: any = mermaidAPI.getConfig();

      expect(config.testObject.test1).toBe(1);

      const testObjSetting: any = { testObject: { test3: true } };
      mermaidAPI.updateSiteConfig(testObjSetting);
      config = mermaidAPI.getConfig();

      expect(config.testObject.test1).toBe(1);
      expect(config.testObject.test2).toBe(false);
      expect(config.testObject.test3).toBe(true);
    });

    it('resets mermaid config to global defaults', () => {
      const config = {
        logLevel: 0,
        securityLevel: 'loose',
      } as const;
      mermaidAPI.initialize(config);
      mermaidAPI.setConfig({ securityLevel: 'strict', logLevel: 1 });
      expect(mermaidAPI.getConfig().logLevel).toBe(1);
      expect(mermaidAPI.getConfig().securityLevel).toBe('strict');
      mermaidAPI.reset();
      expect(mermaidAPI.getConfig().logLevel).toBe(0);
      expect(mermaidAPI.getConfig().securityLevel).toBe('loose');
      mermaidAPI.globalReset();
      expect(mermaidAPI.getConfig().logLevel).toBe(5);
      expect(mermaidAPI.getConfig().securityLevel).toBe('strict');
    });

    it('prevents changes to site defaults (sneaky)', () => {
      const config: any = {
        logLevel: 0,
      };
      mermaidAPI.initialize(config);
      const siteConfig = mermaidAPI.getSiteConfig();
      expect(mermaidAPI.getConfig().logLevel).toBe(0);
      config.secure = {
        toString: () => {
          mermaidAPI.initialize({ securityLevel: 'loose' });
        },
      };
      expect(mermaidAPI.getConfig().secure).toEqual(mermaidAPI.getSiteConfig().secure);
      expect(mermaidAPI.getConfig().securityLevel).toBe('strict');
      mermaidAPI.reset();
      expect(mermaidAPI.getSiteConfig()).toEqual(siteConfig);
      expect(mermaidAPI.getConfig()).toEqual(siteConfig);
    });
    it('prevents clobbering global defaults (direct)', () => {
      const config = assignWithDepth({}, mermaidAPI.defaultConfig);
      assignWithDepth(config, { logLevel: 0 });

      let error: any = { message: '' };
      try {
        // @ts-ignore This is a read-only property. TypeScript will not allow assignment, but regular javascript might.
        mermaidAPI.defaultConfig = config;
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe(
        "Cannot assign to read only property 'defaultConfig' of object '#<Object>'"
      );
      expect(mermaidAPI.defaultConfig.logLevel).toBe(5);
    });
    it('prevents changes to global defaults (direct)', () => {
      let error: any = { message: '' };
      try {
        mermaidAPI.defaultConfig.logLevel = 0;
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe(
        "Cannot assign to read only property 'logLevel' of object '#<Object>'"
      );
      expect(mermaidAPI.defaultConfig.logLevel).toBe(5);
    });
    it('prevents sneaky changes to global defaults (assignWithDepth)', () => {
      const config = {
        logLevel: 0,
      };
      let error: any = { message: '' };
      try {
        assignWithDepth(mermaidAPI.defaultConfig, config);
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe(
        "Cannot assign to read only property 'logLevel' of object '#<Object>'"
      );
      expect(mermaidAPI.defaultConfig.logLevel).toBe(5);
    });
  });

  describe('dompurify config', () => {
    it('allows dompurify config to be set', () => {
      mermaidAPI.initialize({ dompurifyConfig: { ADD_ATTR: ['onclick'] } });

      expect(mermaidAPI.getConfig().dompurifyConfig!.ADD_ATTR).toEqual(['onclick']);
    });
  });

  describe('parse', () => {
    mermaid.parseError = undefined; // ensure it parseError undefined
    it('throws for an invalid definition (with no mermaid.parseError() defined)', async () => {
      expect(mermaid.parseError).toEqual(undefined);
      await expect(
        mermaidAPI.parse('this is not a mermaid diagram definition')
      ).rejects.toThrowError();
    });
    it('throws for a nicer error for a invalid definition starting with `---`', async () => {
      expect(mermaid.parseError).toEqual(undefined);
      await expect(
        mermaidAPI.parse(`
      ---
      title: a malformed YAML front-matter
      `)
      ).rejects.toThrow(
        'Diagrams beginning with --- are not valid. ' +
          'If you were trying to use a YAML front-matter, please ensure that ' +
          "you've correctly opened and closed the YAML front-matter with un-indented `---` blocks"
      );
    });
    it('does not throw for a valid definition', async () => {
      await expect(
        mermaidAPI.parse('graph TD;A--x|text including URL space|B;')
      ).resolves.not.toThrow();
    });
    it('throws for invalid definition', async () => {
      await expect(
        mermaidAPI.parse('this is not a mermaid diagram definition')
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[UnknownDiagramError: No diagram type detected matching given configuration for text: this is not a mermaid diagram definition]`
      );
    });
    it('returns false for invalid definition with silent option', async () => {
      await expect(
        mermaidAPI.parse('this is not a mermaid diagram definition', { suppressErrors: true })
      ).resolves.toBe(false);
    });
    it('resolves for valid definition', async () => {
      await expect(mermaidAPI.parse('graph TD;A--x|text including URL space|B;')).resolves
        .toMatchInlineSnapshot(`
        {
          "config": {},
          "diagramType": "flowchart-v2",
        }
      `);
    });
    it('returns config when defined in frontmatter', async () => {
      await expect(
        mermaidAPI.parse(`---
config:
  theme: base
  flowchart:
    htmlLabels: true
---
graph TD;A--x|text including URL space|B;`)
      ).resolves.toMatchInlineSnapshot(`
  {
    "config": {
      "flowchart": {
        "htmlLabels": true,
      },
      "theme": "base",
    },
    "diagramType": "flowchart-v2",
  }
`);
    });

    it('returns config when defined in directive', async () => {
      await expect(
        mermaidAPI.parse(`%%{init: { 'theme': 'base' } }%%
graph TD;A--x|text including URL space|B;`)
      ).resolves.toMatchInlineSnapshot(`
  {
    "config": {
      "theme": "base",
    },
    "diagramType": "flowchart-v2",
  }
`);
    });

    it('returns merged config when defined in frontmatter and directive', async () => {
      await expect(
        mermaidAPI.parse(`---
config:
  theme: forest
  flowchart:
    htmlLabels: true
---
%%{init: { 'theme': 'base' } }%%
graph TD;A--x|text including URL space|B;`)
      ).resolves.toMatchInlineSnapshot(`
  {
    "config": {
      "flowchart": {
        "htmlLabels": true,
      },
      "theme": "base",
    },
    "diagramType": "flowchart-v2",
  }
`);
    });

    it('returns true for valid definition with silent option', async () => {
      await expect(
        mermaidAPI.parse('graph TD;A--x|text including URL space|B;', { suppressErrors: true })
      ).resolves.toMatchInlineSnapshot(`
          {
            "config": {},
            "diagramType": "flowchart-v2",
          }
        `);
    });
  });

  describe('render', () => {
    // These are more like integration tests right now because nothing is mocked.
    // But it is faster that a cypress test and there's no real reason to actually evaluate an image pixel by pixel.

    // render(id, text, cb?, svgContainingElement?)

    // Test all diagram types.  Note that old flowchart 'graph' type will invoke the flowRenderer-v2. (See the flowchart v2 detector.)
    // We have to have both the specific textDiagramType and the expected type name because the expected type may be slightly different from what is put in the diagram text (ex: in -v2 diagrams)
    const diagramTypesAndExpectations = [
      // { textDiagramType: 'C4Context', expectedType: 'c4' }, TODO : setAccTitle not called in C4 jison parser
      { textDiagramType: 'classDiagram', expectedType: 'class' },
      { textDiagramType: 'classDiagram-v2', expectedType: 'classDiagram' },
      { textDiagramType: 'erDiagram', expectedType: 'er' },
      { textDiagramType: 'graph', expectedType: 'flowchart-v2' },
      { textDiagramType: 'flowchart', expectedType: 'flowchart-v2' },
      { textDiagramType: 'gitGraph', expectedType: 'gitGraph' },
      { textDiagramType: 'gantt', expectedType: 'gantt' },
      { textDiagramType: 'journey', expectedType: 'journey' },
      { textDiagramType: 'pie', expectedType: 'pie' },
      { textDiagramType: 'packet', expectedType: 'packet' },
      { textDiagramType: 'packet-beta', expectedType: 'packet' },
      {
        textDiagramType: 'xychart-beta',
        expectedType: 'xychart',
        content: 'x-axis "Attempts" 10000 --> 10000\ny-axis "Passing tests" 1 --> 1\nbar [1]',
      },
      {
        textDiagramType: 'xychart',
        expectedType: 'xychart',
        content: 'x-axis "Attempts" 10000 --> 10000\ny-axis "Passing tests" 1 --> 1\nbar [1]',
      },
      { textDiagramType: 'requirementDiagram', expectedType: 'requirement' },
      { textDiagramType: 'sequenceDiagram', expectedType: 'sequence' },
      { textDiagramType: 'stateDiagram-v2', expectedType: 'stateDiagram' },
      { textDiagramType: 'radar-beta', expectedType: 'radar' },
      { textDiagramType: 'architecture-beta', expectedType: 'architecture' },
    ];

    describe('accessibility', () => {
      const id = 'mermaid-fauxId';
      const a11yTitle = 'a11y title';
      const a11yDescr = 'a11y description';

      diagramTypesAndExpectations.forEach((testedDiagram) => {
        describe(`${testedDiagram.textDiagramType}`, () => {
          const diagramType = testedDiagram.textDiagramType;
          const content = testedDiagram.content || '';
          const diagramText = `${diagramType}\n accTitle: ${a11yTitle}\n accDescr: ${a11yDescr}\n ${content}`;
          const expectedDiagramType = testedDiagram.expectedType;

          jsdomIt(
            'should set aria-roledescription to the diagram type AND should call addSVGa11yTitleDescription',
            async () => {
              const { svg } = await mermaidAPI.render(id, diagramText);
              const dom = new JSDOM(svg);
              const svgNode = ensureNodeFromSelector('svg', dom.window.document);
              const descNode = ensureNodeFromSelector('desc', svgNode);
              const titleNode = ensureNodeFromSelector('title', svgNode);
              expect(svgNode.getAttribute('aria-roledescription')).toBe(expectedDiagramType);
              expect(svgNode.getAttribute('aria-describedby')).toBe(`chart-desc-${id}`);
              expect(descNode.getAttribute('id')).toBe(`chart-desc-${id}`);
              expect(descNode.innerHTML).toBe(a11yDescr);
              expect(titleNode.innerHTML).toBe(a11yTitle);
            }
          );
        });
      });
    });
  });

  describe('getDiagramFromText', () => {
    it('should clean up comments when present in diagram definition', async () => {
      const diagram = await mermaidAPI.getDiagramFromText(
        `flowchart LR
      %% This is a comment A -- text --> B{node}
      A -- text --> B -- text2 --> C`
      );
      expect(diagram).toBeInstanceOf(Diagram);
      expect(diagram.type).toBe('flowchart-v2');
    });

    it('should not modify db when rendering different diagrams', async () => {
      const stateDiagram1 = await mermaidAPI.getDiagramFromText(
        `stateDiagram
            direction LR
            [*] --> Still
            Still --> [*]
            Still --> Moving
            Moving --> Still
            Moving --> Crash
            Crash --> [*]`
      );
      const stateDiagram2 = await mermaidAPI.getDiagramFromText(
        `stateDiagram
          direction TB
          [*] --> Still
          Still --> [*]
          Still --> Moving
          Moving --> Still
          Moving --> Crash
          Crash --> [*]`
      );
      expect(stateDiagram1.db).not.toBe(stateDiagram2.db);
      assert(stateDiagram1.db instanceof StateDB);
      assert(stateDiagram2.db instanceof StateDB);
      expect(stateDiagram1.db.getDirection()).not.toEqual(stateDiagram2.db.getDirection());

      const flowDiagram1 = await mermaidAPI.getDiagramFromText(
        `flowchart LR
      A -- text --> B -- text2 --> C`
      );
      const flowDiagram2 = await mermaidAPI.getDiagramFromText(
        `flowchart TD
      A -- text --> B -- text2 --> C`
      );
      // Since flowDiagram will return new Db object each time, we can compare the db to be different.
      expect(flowDiagram1.db).not.toBe(flowDiagram2.db);
      assert(flowDiagram1.db instanceof FlowDB);
      assert(flowDiagram2.db instanceof FlowDB);
      expect(flowDiagram1.db.getDirection()).not.toEqual(flowDiagram2.db.getDirection());

      const classDiagram1 = await mermaidAPI.getDiagramFromText(
        `classDiagram
            direction TB
            class Student {
              -idCard : IdCard
            }
            class IdCard{
              -id : int
              -name : string
            }
            class Bike{
              -id : int
              -name : string
            }
            Student "1" --o "1" IdCard : carries
            Student "1" --o "1" Bike : rides`
      );
      const classDiagram2 = await mermaidAPI.getDiagramFromText(
        `classDiagram
            direction LR
            class Student {
              -idCard : IdCard
            }
            class IdCard{
              -id : int
              -name : string
            }
            class Bike{
              -id : int
              -name : string
            }
            Student "1" --o "1" IdCard : carries
            Student "1" --o "1" Bike : rides`
      );
      // Since classDiagram will return new Db object each time, we can compare the db to be different.
      expect(classDiagram1.db).not.toBe(classDiagram2.db);
      assert(classDiagram1.db instanceof ClassDB);
      assert(classDiagram2.db instanceof ClassDB);
      expect(classDiagram1.db.getDirection()).not.toEqual(classDiagram2.db.getDirection());

      const sequenceDiagram1 = await mermaidAPI.getDiagramFromText(
        `sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!`
      );
      const sequenceDiagram2 = await mermaidAPI.getDiagramFromText(
        `sequenceDiagram
        actor A1
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!`
      );

      // Since sequenceDiagram will return new Db object each time, we can compare the db to be different.
      expect(sequenceDiagram1.db).not.toBe(sequenceDiagram2.db);
      assert(sequenceDiagram1.db instanceof SequenceDB);
      assert(sequenceDiagram2.db instanceof SequenceDB);
      expect(sequenceDiagram1.db.getActors()).not.toEqual(sequenceDiagram2.db.getActors());
    });
  });

  describe('mermaidAPI config precedence', () => {
    const id = 'mermaid-config-test';

    beforeEach(() => {
      mermaidAPI.globalReset();
    });

    jsdomIt('renders with YAML config taking precedence over initialize config', async () => {
      mermaid.initialize({
        theme: 'forest',
        fontFamily: 'Arial',
        themeVariables: { fontFamily: 'Arial', fontSize: '16px' },
        flowchart: { htmlLabels: false },
      });

      const diagramText = `---
config:
  theme: base
  fontFamily: Courier
  themeVariables:
    fontFamily: "Courier New"
    fontSize: "20px"
  flowchart:
    htmlLabels: true
---
flowchart TD
  A --> B
`;

      const { svg } = await mermaidAPI.render('yaml-over-init', diagramText);

      const config = mermaidAPI.getConfig();
      expect(config.theme).toBe('base');
      expect(config.fontFamily).toBe('Courier');
      expect(config.themeVariables.fontFamily).toBe('Courier New');
      expect(config.themeVariables.fontSize).toBe('20px');
      expect(config.flowchart?.htmlLabels).toBe(true);

      const svgNode = ensureNodeFromSelector('svg', new JSDOM(svg).window.document);
      expect(svgNode).not.toBeNull();
    });

    jsdomIt(
      'renders with YAML themeVariables fully overriding initialize themeVariables',
      async () => {
        mermaid.initialize({
          themeVariables: { fontFamily: 'Arial', fontSize: '16px' },
        });

        const diagramText = `---
config:
  themeVariables:
    fontFamily: "Courier New"
    fontSize: "20px"
---
flowchart TD
  A --> B
`;

        const { svg } = await mermaidAPI.render(id, diagramText);
        const config = mermaidAPI.getConfig();

        expect(config.themeVariables.fontFamily).toBe('Courier New');
        expect(config.themeVariables.fontSize).toBe('20px');
        expect(config.themeVariables.fontFamily).not.toBe('Arial');
        expect(config.themeVariables.fontSize).not.toBe('16px');

        const svgNode = ensureNodeFromSelector('svg', new JSDOM(svg).window.document);
        expect(svgNode).not.toBeNull();
      }
    );

    jsdomIt(
      'renders with YAML themeVariables overriding only provided keys and keeping others from initialize',
      async () => {
        mermaid.initialize({
          theme: 'forest',
          fontFamily: 'Arial',
          themeVariables: { fontFamily: 'Arial', fontSize: '16px', colorPrimary: '#ff0000' },
        });

        const diagramText = `---
config:
  themeVariables:
    fontFamily: "Courier New"
---
flowchart TD
  A --> B
`;

        const { svg } = await mermaidAPI.render(id, diagramText);

        const config = mermaidAPI.getConfig();
        expect(config.themeVariables.fontFamily).toBe('Courier New');
        expect(config.themeVariables.fontSize).toBe('16px');
        expect(config.themeVariables.colorPrimary).toBe('#ff0000');

        const svgNode = ensureNodeFromSelector('svg', new JSDOM(svg).window.document);
        expect(svgNode).not.toBeNull();
      }
    );

    jsdomIt(
      'renders with YAML config (no themeVariables) and falls back to initialize themeVariables',
      async () => {
        mermaid.initialize({
          themeVariables: { fontFamily: 'Arial', fontSize: '16px' },
        });

        const diagramText = `---
config:
  theme: base
---
flowchart TD
  A --> B
`;

        const { svg } = await mermaidAPI.render(id, diagramText);

        const config = mermaidAPI.getConfig();
        expect(config.themeVariables.fontFamily).toBe('Arial');
        expect(config.themeVariables.fontSize).toBe('16px');
        expect(config.theme).toBe('base');

        const svgNode = ensureNodeFromSelector('svg', new JSDOM(svg).window.document);
        expect(svgNode).not.toBeNull();
      }
    );

    jsdomIt(
      'renders with full YAML config block taking full precedence over initialize config',
      async () => {
        mermaid.initialize({
          theme: 'forest',
          fontFamily: 'Arial',
          themeVariables: { fontFamily: 'Arial', fontSize: '16px' },
          flowchart: { htmlLabels: false },
        });

        const diagramText = `---
config:
  theme: base
  fontFamily: Courier
  themeVariables:
    fontFamily: "Courier New"
    fontSize: "20px"
  flowchart:
    htmlLabels: true
---
flowchart TD
  A --> B
`;

        const { svg } = await mermaidAPI.render('yaml-over-init', diagramText);

        const config = mermaidAPI.getConfig();
        expect(config.theme).toBe('base');
        expect(config.fontFamily).toBe('Courier');
        expect(config.themeVariables.fontFamily).toBe('Courier New');
        expect(config.themeVariables.fontSize).toBe('20px');
        expect(config.flowchart?.htmlLabels).toBe(true);

        const svgNode = ensureNodeFromSelector('svg', new JSDOM(svg).window.document);
        expect(svgNode).not.toBeNull();
      }
    );

    jsdomIt(
      'renders with YAML config (no themeVariables) and falls back to initialize themeVariables (duplicate scenario)',
      async () => {
        mermaid.initialize({
          themeVariables: { fontFamily: 'Arial', fontSize: '16px' },
        });

        const diagramText = `---
config:
  theme: base
---
flowchart TD
  A --> B
`;

        await mermaidAPI.render(id, diagramText);

        const config = mermaidAPI.getConfig();
        expect(config.themeVariables.fontFamily).toBe('Arial');
        expect(config.themeVariables.fontSize).toBe('16px');
        expect(config.theme).toBe('base');
      }
    );

    jsdomIt('renders with no YAML config so initialize config is fully applied', async () => {
      mermaid.initialize({
        theme: 'forest',
        fontFamily: 'Arial',
        themeVariables: { fontFamily: 'Arial', fontSize: '16px' },
      });

      const diagramText = `
flowchart TD
  A --> B
`;

      await mermaidAPI.render(id, diagramText);

      const config = mermaidAPI.getConfig();
      expect(config.theme).toBe('forest');
      expect(config.fontFamily).toBe('Arial');
      expect(config.themeVariables.fontFamily).toBe('Arial');
      expect(config.themeVariables.fontSize).toBe('16px');
    });

    jsdomIt(
      'renders with empty YAML config block and falls back to initialize config',
      async () => {
        mermaid.initialize({
          theme: 'dark',
          themeVariables: { fontFamily: 'Times', fontSize: '14px' },
        });

        const diagramText = `---
config: {}
---
flowchart TD
  A --> B
`;

        await mermaidAPI.render(id, diagramText);

        const config = mermaidAPI.getConfig();
        expect(config.theme).toBe('dark');
        expect(config.themeVariables.fontFamily).toBe('Times');
        expect(config.themeVariables.fontSize).toBe('14px');
      }
    );
  });
});
