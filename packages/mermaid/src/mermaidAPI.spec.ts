'use strict';
import { vi } from 'vitest';

// -------------------------------------
//  Mocks and mocking

import { MockedD3 } from './tests/MockedD3.js';

// Note: If running this directly from within an IDE, the mocks directory must be at packages/mermaid/mocks
vi.mock('d3');
vi.mock('dagre-d3');

// mermaidAPI.spec.ts:
import * as accessibility from './accessibility.js'; // Import it this way so we can use spyOn(accessibility,...)
vi.mock('./accessibility.js', () => ({
  setA11yDiagramInfo: vi.fn(),
  addSVGa11yTitleDescription: vi.fn(),
}));

// Mock the renderers specifically so we can test render(). Need to mock draw() for each renderer
vi.mock('./diagrams/c4/c4Renderer.js');
vi.mock('./diagrams/class/classRenderer.js');
vi.mock('./diagrams/class/classRenderer-v2.js');
vi.mock('./diagrams/er/erRenderer.js');
vi.mock('./diagrams/flowchart/flowRenderer-v2.js');
vi.mock('./diagrams/git/gitGraphRenderer.js');
vi.mock('./diagrams/gantt/ganttRenderer.js');
vi.mock('./diagrams/user-journey/journeyRenderer.js');
vi.mock('./diagrams/pie/pieRenderer.js');
vi.mock('./diagrams/requirement/requirementRenderer.js');
vi.mock('./diagrams/sequence/sequenceRenderer.js');
vi.mock('./diagrams/state/stateRenderer-v2.js');

// -------------------------------------

import mermaid from './mermaid.js';
import { MermaidConfig } from './config.type.js';

import mermaidAPI, { removeExistingElements } from './mermaidAPI.js';
import {
  encodeEntities,
  decodeEntities,
  createCssStyles,
  createUserStyles,
  appendDivSvgG,
  cleanUpSvgCode,
  putIntoIFrame,
} from './mermaidAPI.js';

import assignWithDepth from './assignWithDepth.js';

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
      const result = cleanUpSvgCode('¶ß brrrr', true, true);
      expect(result).toEqual('; brrrr');
    });

    it('replaces old style br tags with new style', () => {
      const result = cleanUpSvgCode('<br> brrrr<br>', true, true);
      expect(result).toEqual('<br/> brrrr<br/>');
    });
  });

  describe('putIntoIFrame', () => {
    const inputSvgCode = 'this is the SVG code';

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
      const base64encodedSrc = btoa('<body style="' + 'margin:0' + '">' + inputSvgCode + '</body>');
      const expectedRegExp = new RegExp('src="data:text/html;base64,' + base64encodedSrc + '"');

      const result = putIntoIFrame(inputSvgCode);
      expect(result).toMatch(expectedRegExp);
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

  const fauxParentNode = new MockedD3();
  const fauxEnclosingDiv = new MockedD3();
  const fauxSvgNode = new MockedD3();

  describe('appendDivSvgG', () => {
    const fauxGNode = new MockedD3();
    const parent_append_spy = vi.spyOn(fauxParentNode, 'append').mockReturnValue(fauxEnclosingDiv);
    const div_append_spy = vi.spyOn(fauxEnclosingDiv, 'append').mockReturnValue(fauxSvgNode);
    // @ts-ignore @todo TODO why is this getting a type error?
    const div_attr_spy = vi.spyOn(fauxEnclosingDiv, 'attr').mockReturnValue(fauxEnclosingDiv);
    const svg_append_spy = vi.spyOn(fauxSvgNode, 'append').mockReturnValue(fauxGNode);
    // @ts-ignore @todo TODO why is this getting a type error?
    const svg_attr_spy = vi.spyOn(fauxSvgNode, 'attr').mockReturnValue(fauxSvgNode);

    it('appends a div node', () => {
      appendDivSvgG(fauxParentNode, 'theId', 'dtheId');
      expect(parent_append_spy).toHaveBeenCalledWith('div');
      expect(div_append_spy).toHaveBeenCalledWith('svg');
    });
    it('the id for the div is "d" with the id appended', () => {
      appendDivSvgG(fauxParentNode, 'theId', 'dtheId');
      expect(div_attr_spy).toHaveBeenCalledWith('id', 'dtheId');
    });

    it('sets the style for the div if one is given', () => {
      appendDivSvgG(fauxParentNode, 'theId', 'dtheId', 'given div style', 'given x link');
      expect(div_attr_spy).toHaveBeenCalledWith('style', 'given div style');
    });

    it('appends a svg node to the div node', () => {
      appendDivSvgG(fauxParentNode, 'theId', 'dtheId');
      expect(div_attr_spy).toHaveBeenCalledWith('id', 'dtheId');
    });
    it('sets the svg width to 100%', () => {
      appendDivSvgG(fauxParentNode, 'theId', 'dtheId');
      expect(svg_attr_spy).toHaveBeenCalledWith('width', '100%');
    });
    it('the svg id is the id', () => {
      appendDivSvgG(fauxParentNode, 'theId', 'dtheId');
      expect(svg_attr_spy).toHaveBeenCalledWith('id', 'theId');
    });
    it('the svg xml namespace is the 2000 standard', () => {
      appendDivSvgG(fauxParentNode, 'theId', 'dtheId');
      expect(svg_attr_spy).toHaveBeenCalledWith('xmlns', 'http://www.w3.org/2000/svg');
    });
    it('sets the  svg xlink if one is given', () => {
      appendDivSvgG(fauxParentNode, 'theId', 'dtheId', 'div style', 'given x link');
      expect(svg_attr_spy).toHaveBeenCalledWith('xmlns:xlink', 'given x link');
    });
    it('appends a g (group) node to the svg node', () => {
      appendDivSvgG(fauxParentNode, 'theId', 'dtheId');
      expect(svg_append_spy).toHaveBeenCalledWith('g');
    });
    it('returns the given parentRoot d3 nodes', () => {
      expect(appendDivSvgG(fauxParentNode, 'theId', 'dtheId')).toEqual(fauxParentNode);
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
      const styles = createCssStyles(mocked_config_with_htmlLabels, 'graphType', null);
      expect(styles).toMatch(/^\ndefault(.*)/);
    });
    it('gets the fontFamily from the config', () => {
      const styles = createCssStyles(mocked_config_with_htmlLabels, 'graphType', {});
      expect(styles).toMatch(/(.*)\n:root { --mermaid-font-family: serif(.*)/);
    });
    it('gets the alt fontFamily from the config', () => {
      const styles = createCssStyles(mocked_config_with_htmlLabels, 'graphType', undefined);
      expect(styles).toMatch(/(.*)\n:root { --mermaid-alt-font-family: sans-serif(.*)/);
    });

    describe('there are some classDefs', () => {
      const classDef1 = { id: 'classDef1', styles: ['style1-1', 'style1-2'], textStyles: [] };
      const classDef2 = { id: 'classDef2', styles: [], textStyles: ['textStyle2-1'] };
      const classDef3 = { id: 'classDef3', textStyles: ['textStyle3-1', 'textStyle3-2'] };
      const classDefs = { classDef1, classDef2, classDef3 };

      describe('the graph supports classDefs', () => {
        const graphType = 'flowchart-v2';

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

              const styles = createCssStyles(mocked_config, graphType, classDefs);
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
          const mocked_config_no_htmlLabels = {
            themeCSS: 'default',
            fontFamily: 'serif',
            altFontFamily: 'sans-serif',
          };

          describe('creates styles for shape elements "rect", "polygon", "ellipse", and "circle"', () => {
            const htmlElements = ['rect', 'polygon', 'ellipse', 'circle'];

            it('creates CSS styles for every style and textStyle in every classDef', () => {
              // TODO Can't figure out how to spy on the cssImportantStyles method. That would be a much better approach than manually checking the result.

              const styles = createCssStyles(mocked_config_no_htmlLabels, graphType, classDefs);
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

      createUserStyles(mockConfig, 'flowchart-v2', { classDef1 }, 'someId');
      const expectedStyles =
        '\ndefault' +
        '\n.classDef1 > * { style1-1 !important; }' +
        '\n.classDef1 span { style1-1 !important; }';
      expect(getStyles).toHaveBeenCalledWith('flowchart-v2', expectedStyles, {
        fontFamily: 'serif',
      });
    });

    it('calls getStyles to get css for all graph, user css styles, and config theme variables', () => {
      createUserStyles(mockConfig, 'someDiagram', {}, 'someId');
      expect(getStyles).toHaveBeenCalled();
    });

    it('returns the result of compiling, stringifying, and serializing the css code with stylis', () => {
      const result = createUserStyles(mockConfig, 'someDiagram', {}, 'someId');
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
      };
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
      // mermaidAPI.reinitialize(config);
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
        // @ts-ignore This is a read-only property. Typescript will not allow assignment, but regular javascript might.
        mermaidAPI['defaultConfig'] = config;
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe(
        "Cannot assign to read only property 'defaultConfig' of object '#<Object>'"
      );
      expect(mermaidAPI.defaultConfig['logLevel']).toBe(5);
    });
    it('prevents changes to global defaults (direct)', () => {
      let error: any = { message: '' };
      try {
        mermaidAPI.defaultConfig['logLevel'] = 0;
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe(
        "Cannot assign to read only property 'logLevel' of object '#<Object>'"
      );
      expect(mermaidAPI.defaultConfig['logLevel']).toBe(5);
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
      expect(mermaidAPI.defaultConfig['logLevel']).toBe(5);
    });
  });

  describe('dompurify config', () => {
    it('allows dompurify config to be set', () => {
      mermaidAPI.initialize({ dompurifyConfig: { ADD_ATTR: ['onclick'] } });

      expect(mermaidAPI!.getConfig()!.dompurifyConfig!.ADD_ATTR).toEqual(['onclick']);
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
        '"No diagram type detected matching given configuration for text: this is not a mermaid diagram definition"'
      );
    });
    it('returns false for invalid definition with silent option', async () => {
      await expect(
        mermaidAPI.parse('this is not a mermaid diagram definition', { suppressErrors: true })
      ).resolves.toBe(false);
    });
    it('resolves for valid definition', async () => {
      await expect(
        mermaidAPI.parse('graph TD;A--x|text including URL space|B;')
      ).resolves.toBeTruthy();
    });
    it('returns true for valid definition with silent option', async () => {
      await expect(
        mermaidAPI.parse('graph TD;A--x|text including URL space|B;', { suppressErrors: true })
      ).resolves.toBe(true);
    });
  });

  describe('render', () => {
    // These are more like integration tests right now because nothing is mocked.
    // But it is faster that a cypress test and there's no real reason to actually evaluate an image pixel by pixel.

    // render(id, text, cb?, svgContainingElement?)

    // Test all diagram types.  Note that old flowchart 'graph' type will invoke the flowRenderer-v2. (See the flowchart v2 detector.)
    // We have to have both the specific textDiagramType and the expected type name because the expected type may be slightly different than was is put in the diagram text (ex: in -v2 diagrams)
    const diagramTypesAndExpectations = [
      { textDiagramType: 'C4Context', expectedType: 'c4' },
      { textDiagramType: 'classDiagram', expectedType: 'classDiagram' },
      { textDiagramType: 'classDiagram-v2', expectedType: 'classDiagram' },
      { textDiagramType: 'erDiagram', expectedType: 'er' },
      { textDiagramType: 'graph', expectedType: 'flowchart-v2' },
      { textDiagramType: 'flowchart', expectedType: 'flowchart-v2' },
      { textDiagramType: 'gitGraph', expectedType: 'gitGraph' },
      { textDiagramType: 'gantt', expectedType: 'gantt' },
      { textDiagramType: 'journey', expectedType: 'journey' },
      { textDiagramType: 'pie', expectedType: 'pie' },
      { textDiagramType: 'requirementDiagram', expectedType: 'requirement' },
      { textDiagramType: 'sequenceDiagram', expectedType: 'sequence' },
      { textDiagramType: 'stateDiagram-v2', expectedType: 'stateDiagram' },
    ];

    describe('accessibility', () => {
      const id = 'mermaid-fauxId';
      const a11yTitle = 'a11y title';
      const a11yDescr = 'a11y description';

      diagramTypesAndExpectations.forEach((testedDiagram) => {
        describe(`${testedDiagram.textDiagramType}`, () => {
          const diagramType = testedDiagram.textDiagramType;
          const diagramText = `${diagramType}\n accTitle: ${a11yTitle}\n accDescr: ${a11yDescr}\n`;
          const expectedDiagramType = testedDiagram.expectedType;

          it('aria-roledscription is set to the diagram type, addSVGa11yTitleDescription is called', async () => {
            const a11yDiagramInfo_spy = vi.spyOn(accessibility, 'setA11yDiagramInfo');
            const a11yTitleDesc_spy = vi.spyOn(accessibility, 'addSVGa11yTitleDescription');
            await mermaidAPI.render(id, diagramText);
            expect(a11yDiagramInfo_spy).toHaveBeenCalledWith(
              expect.anything(),
              expectedDiagramType
            );
            expect(a11yTitleDesc_spy).toHaveBeenCalled();
          });
        });
      });
    });
  });

  describe('render', () => {
    // Be sure to add async before each test (anonymous) method

    // These are more like integration tests right now because nothing is mocked.
    // But it is faster that a cypress test and there's no real reason to actually evaluate an image pixel by pixel.

    // render(id, text, cb?, svgContainingElement?)

    // Test all diagram types.  Note that old flowchart 'graph' type will invoke the flowRenderer-v2. (See the flowchart v2 detector.)
    // We have to have both the specific textDiagramType and the expected type name because the expected type may be slightly different than was is put in the diagram text (ex: in -v2 diagrams)
    const diagramTypesAndExpectations = [
      { textDiagramType: 'C4Context', expectedType: 'c4' },
      { textDiagramType: 'classDiagram', expectedType: 'classDiagram' },
      { textDiagramType: 'classDiagram-v2', expectedType: 'classDiagram' },
      { textDiagramType: 'erDiagram', expectedType: 'er' },
      { textDiagramType: 'graph', expectedType: 'flowchart-v2' },
      { textDiagramType: 'flowchart', expectedType: 'flowchart-v2' },
      { textDiagramType: 'gitGraph', expectedType: 'gitGraph' },
      { textDiagramType: 'gantt', expectedType: 'gantt' },
      { textDiagramType: 'journey', expectedType: 'journey' },
      { textDiagramType: 'pie', expectedType: 'pie' },
      { textDiagramType: 'requirementDiagram', expectedType: 'requirement' },
      { textDiagramType: 'sequenceDiagram', expectedType: 'sequence' },
      { textDiagramType: 'stateDiagram-v2', expectedType: 'stateDiagram' },
    ];

    describe('accessibility', () => {
      const id = 'mermaid-fauxId';
      const a11yTitle = 'a11y title';
      const a11yDescr = 'a11y description';

      diagramTypesAndExpectations.forEach((testedDiagram) => {
        describe(`${testedDiagram.textDiagramType}`, () => {
          const diagramType = testedDiagram.textDiagramType;
          const diagramText = `${diagramType}\n accTitle: ${a11yTitle}\n accDescr: ${a11yDescr}\n`;
          const expectedDiagramType = testedDiagram.expectedType;

          it('aria-roledscription is set to the diagram type, addSVGa11yTitleDescription is called', async () => {
            const a11yDiagramInfo_spy = vi.spyOn(accessibility, 'setA11yDiagramInfo');
            const a11yTitleDesc_spy = vi.spyOn(accessibility, 'addSVGa11yTitleDescription');
            await mermaidAPI.render(id, diagramText);
            expect(a11yDiagramInfo_spy).toHaveBeenCalledWith(
              expect.anything(),
              expectedDiagramType
            );
            expect(a11yTitleDesc_spy).toHaveBeenCalled();
          });
        });
      });
    });
  });
});
