import { sanitizeText, removeScript, parseGenericTypes, countOccurrence } from './common.js';

describe('when securityLevel is antiscript, all script must be removed', () => {
  /**
   * @param original - The original text
   * @param result - The expected sanitized text
   */
  function compareRemoveScript(original: string, result: string) {
    expect(removeScript(original).trim()).toEqual(result);
  }

  it('should remove all script block, script inline.', () => {
    const labelString = `1
		Act1: Hello 1<script src="http://abc.com/script1.js"></script>1
		<b>Act2</b>:
		1<script>
			alert('script run......');
		</script>1
	1`;
    const exactlyString = `1
		Act1: Hello 11
		<b>Act2</b>:
		11
	1`;
    compareRemoveScript(labelString, exactlyString);
  });

  it('should remove all javascript urls', () => {
    compareRemoveScript(
      `This is a <a href="javascript:runHijackingScript();">clean link</a> + <a href="javascript:runHijackingScript();">clean link</a>
  and <a href="javascript&colon;bipassedMining();">me too</a>`,
      `This is a <a>clean link</a> + <a>clean link</a>
  and <a>me too</a>`
    );
  });

  it('should detect malicious images', () => {
    compareRemoveScript(`<img onerror="alert('hello');">`, `<img>`);
  });

  it('should detect unsecured target attribute, if value is _blank then generate a secured link', () => {
    compareRemoveScript(
      `<a href="https://mermaid.js.org/" target="_blank">note about mermaid</a>`,
      `<a href="https://mermaid.js.org/" target="_blank" rel="noopener">note about mermaid</a>`
    );
  });

  it('should detect unsecured target attribute from links', () => {
    compareRemoveScript(
      `<a href="https://mermaid.js.org/" target="_self">note about mermaid</a>`,
      `<a href="https://mermaid.js.org/" target="_self">note about mermaid</a>`
    );
  });

  it('should detect iframes', () => {
    compareRemoveScript(
      `<iframe src="http://abc.com/script1.js"></iframe>
    <iframe src="http://example.com/iframeexample"></iframe>`,
      ''
    );
  });
});

describe('Sanitize text', () => {
  it('should remove script tag', () => {
    const maliciousStr = 'javajavascript:script:alert(1)';
    const result = sanitizeText(maliciousStr, {
      securityLevel: 'strict',
      flowchart: { htmlLabels: true },
    });
    expect(result).not.toContain('javascript:alert(1)');
  });
});

describe('generic parser', () => {
  it.each([
    ['test~T~', 'test<T>'],
    ['test~Array~Array~string~~~', 'test<Array<Array<string>>>'],
    ['test~Array~Array~string[]~~~', 'test<Array<Array<string[]>>>'],
    ['test ~Array~Array~string[]~~~', 'test <Array<Array<string[]>>>'],
    ['~test', '~test'],
    ['~test~T~', '~test<T>'],
  ])('should parse generic types: %s to %s', (input: string, expected: string) => {
    expect(parseGenericTypes(input)).toEqual(expected);
  });
});

it.each([
  ['', '', 0],
  ['', 'x', 0],
  ['test', 'x', 0],
  ['test', 't', 2],
  ['test', 'te', 1],
  ['test~T~', '~', 2],
  ['test~Array~Array~string~~~', '~', 6],
])(
  'should count `%s` to contain occurrences of `%s` to be `%i`',
  (str: string, substring: string, count: number) => {
    expect(countOccurrence(str, substring)).toEqual(count);
  }
);
