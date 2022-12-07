'use strict';
import { vi } from 'vitest';

import mermaid from './mermaid';
import { MermaidConfig } from './config.type';

import mermaidAPI, { removeExistingElements } from './mermaidAPI';
import {
  encodeEntities,
  decodeEntities,
  createCssStyles,
  createUserStyles,
  appendDivSvgG,
  cleanUpSvgCode,
  putIntoIFrame,
} from './mermaidAPI';

import assignWithDepth from './assignWithDepth';

// --------------
// Mocks
//   To mock a module, first define a mock for it, then (if used explicitly in the tests) import it. Be sure the path points to exactly the same file as is imported in mermaidAPI (the module being tested)
vi.mock('./styles', () => {
  return {
    addStylesForDiagram: vi.fn(),
    default: vi.fn().mockReturnValue(' .userStyle { font-weight:bold; }'),
  };
});
import getStyles from './styles';

vi.mock('stylis', () => {
  return {
    stringify: vi.fn(),
    compile: vi.fn(),
    serialize: vi.fn().mockReturnValue('stylis serialized css'),
  };
});
import { compile, serialize } from 'stylis';

import { MockedD3 } from './tests/MockedD3';

// -------------------------------------------------------------------------------------

describe('mermaidAPI', function () {
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
              // @todo TODO Can't figure out how to spy on the cssImportantStyles method. That would be a much better approach than manually checking the result

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
              // @todo TODO Can't figure out how to spy on the cssImportantStyles method. That would be a much better approach than manually checking the result

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
    const tempiFrameElement = givenDocument.createElement('div'); // doesn't matter what the tag is in the test
    tempiFrameElement.id = tempIframeId;

    it('removes an existing element with given id', () => {
      rootHtml.appendChild(svgElement);
      expect(givenDocument.getElementById(svgElement.id)).toEqual(svgElement);
      removeExistingElements(givenDocument, false, svgId, tempDivId, tempIframeId);
      expect(givenDocument.getElementById(svgElement.id)).toBeNull();
    });

    describe('is in sandboxed mode', () => {
      const inSandboxedMode = true;

      it('removes an existing element with the given iFrame selector', () => {
        tempiFrameElement.append(svgElement);
        rootHtml.append(tempiFrameElement);
        rootHtml.append(tempDivElement);

        expect(givenDocument.getElementById(tempIframeId)).toEqual(tempiFrameElement);
        expect(givenDocument.getElementById(tempDivId)).toEqual(tempDivElement);
        expect(givenDocument.getElementById(svgId)).toEqual(svgElement);
        removeExistingElements(
          givenDocument,
          inSandboxedMode,
          svgId,
          '#' + tempDivId,
          '#' + tempIframeId
        );
        expect(givenDocument.getElementById(tempDivId)).toEqual(tempDivElement);
        expect(givenDocument.getElementById(tempIframeId)).toBeNull();
        expect(givenDocument.getElementById(svgId)).toBeNull();
      });
    });
    describe('not in sandboxed mode', () => {
      const inSandboxedMode = false;

      it('removes an existing element with the given enclosing div selector', () => {
        tempDivElement.append(svgElement);
        rootHtml.append(tempDivElement);
        rootHtml.append(tempiFrameElement);

        expect(givenDocument.getElementById(tempIframeId)).toEqual(tempiFrameElement);
        expect(givenDocument.getElementById(tempDivId)).toEqual(tempDivElement);
        expect(givenDocument.getElementById(svgId)).toEqual(svgElement);
        removeExistingElements(
          givenDocument,
          inSandboxedMode,
          svgId,
          '#' + tempDivId,
          '#' + tempIframeId
        );
        expect(givenDocument.getElementById(tempIframeId)).toEqual(tempiFrameElement);
        expect(givenDocument.getElementById(tempDivId)).toBeNull();
        expect(givenDocument.getElementById(svgId)).toBeNull();
      });
    });
  });

  describe('initialize', function () {
    beforeEach(function () {
      document.body.innerHTML = '';
      mermaidAPI.globalReset();
    });

    it('copies a literal into the configuration', function () {
      const orgConfig: any = mermaidAPI.getConfig();
      expect(orgConfig.testLiteral).toBe(undefined);

      const testConfig: any = { testLiteral: true };

      mermaidAPI.initialize(testConfig);
      const config: any = mermaidAPI.getConfig();

      expect(config.testLiteral).toBe(true);
    });

    it('copies a an object into the configuration', function () {
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

    it('resets mermaid config to global defaults', function () {
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

    it('prevents changes to site defaults (sneaky)', function () {
      const config: any = {
        logLevel: 0,
      };
      mermaidAPI.initialize(config);
      const siteConfig = mermaidAPI.getSiteConfig();
      expect(mermaidAPI.getConfig().logLevel).toBe(0);
      config.secure = {
        toString: function () {
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
    it('prevents clobbering global defaults (direct)', function () {
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
    it('prevents changes to global defaults (direct)', function () {
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
    it('prevents sneaky changes to global defaults (assignWithDepth)', function () {
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
  describe('dompurify config', function () {
    it('allows dompurify config to be set', function () {
      mermaidAPI.initialize({ dompurifyConfig: { ADD_ATTR: ['onclick'] } });

      expect(mermaidAPI!.getConfig()!.dompurifyConfig!.ADD_ATTR).toEqual(['onclick']);
    });
  });
  describe('parse', function () {
    mermaid.parseError = undefined; // ensure it parseError undefined
    it('throws for an invalid definition (with no mermaid.parseError() defined)', function () {
      expect(mermaid.parseError).toEqual(undefined);
      expect(() => mermaidAPI.parse('this is not a mermaid diagram definition')).toThrow();
    });
    it('does not throw for a valid definition', function () {
      expect(() => mermaidAPI.parse('graph TD;A--x|text including URL space|B;')).not.toThrow();
    });
    it('returns false for invalid definition WITH a parseError() callback defined', function () {
      let parseErrorWasCalled = false;
      // also test setParseErrorHandler() call working to set mermaid.parseError
      expect(
        mermaidAPI.parse('this is not a mermaid diagram definition', () => {
          parseErrorWasCalled = true;
        })
      ).toEqual(false);
      expect(parseErrorWasCalled).toEqual(true);
    });
    it('returns true for valid definition', function () {
      expect(mermaidAPI.parse('graph TD;A--x|text including URL space|B;')).toEqual(true);
    });
  });
});
