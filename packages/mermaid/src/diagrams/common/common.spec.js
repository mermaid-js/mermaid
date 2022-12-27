import { sanitizeText, removeScript, parseGenericTypes } from './common';

describe('when securityLevel is antiscript, all script must be removed', function () {
  /**
   * @param {string} original The original text
   * @param {string} result The expected sanitized text
   */
  function compareRemoveScript(original, result) {
    expect(removeScript(original).trim()).toEqual(result);
  }

  it('should remove all script block, script inline.', function () {
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

  it('should remove all javascript urls', function () {
    compareRemoveScript(
      `This is a <a href="javascript:runHijackingScript();">clean link</a> + <a href="javascript:runHijackingScript();">clean link</a>
  and <a href="javascript&colon;bipassedMining();">me too</a>`,
      `This is a <a>clean link</a> + <a>clean link</a>
  and <a>me too</a>`
    );
  });

  it('should detect malicious images', function () {
    compareRemoveScript(`<img onerror="alert('hello');">`, `<img>`);
  });

  it('should detect iframes', function () {
    compareRemoveScript(
      `<iframe src="http://abc.com/script1.js"></iframe>
    <iframe src="http://example.com/iframeexample"></iframe>`,
      ''
    );
  });
});

describe('Sanitize text', function () {
  it('should remove script tag', function () {
    const maliciousStr = 'javajavascript:script:alert(1)';
    const result = sanitizeText(maliciousStr, {
      securityLevel: 'strict',
      flowchart: { htmlLabels: true },
    });
    expect(result).not.toContain('javascript:alert(1)');
  });
});

describe('generic parser', function () {
  it('should parse generic types', function () {
    expect(parseGenericTypes('test~T~')).toEqual('test<T>');
    expect(parseGenericTypes('test~Array~Array~string~~~')).toEqual('test<Array<Array<string>>>');
    expect(parseGenericTypes('test~Array~Array~string[]~~~')).toEqual(
      'test<Array<Array<string[]>>>'
    );
    expect(parseGenericTypes('test ~Array~Array~string[]~~~')).toEqual(
      'test <Array<Array<string[]>>>'
    );
    expect(parseGenericTypes('~test')).toEqual('~test');
    expect(parseGenericTypes('~test Array~string~')).toEqual('~test Array<string>');
  });
});
