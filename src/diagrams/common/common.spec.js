import { sanitizeText, removeScript, removeEscapes } from './common';

describe('when securityLevel is antiscript, all script must be removed', function () {
  /**
   * @param {string} original The original text
   * @param {string} result The expected sanitized text
   */
  function compareRemoveScript(original, result) {
    expect(removeScript(original)).toEqual(result);
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
      `This is a <a href="#runHijackingScript();">clean link</a> + <a href="#runHijackingScript();">clean link</a>
  and <a href="#;bipassedMining();">me too</a>`
    );
  });

  it('should detect malicious images', function () {
    compareRemoveScript(`<img onerror="alert('hello');">`, `<img onerror:"alert('hello');">`);
  });

  it('should detect iframes', function () {
    compareRemoveScript(
      `<iframe src="http://abc.com/script1.js"></iframe>
    <iframe src="http://example.com/iframeexample"></iframe>`,
      ` src="http://abc.com/script1.js"></iframe>
     src="http://example.com/iframeexample"></iframe>`
    );
  });
});

describe('remove escape code in text', function () {
  it('should remove a unicode colon', function () {
    const labelString = '\\u003A';

    const result = removeEscapes(labelString);
    expect(result).toEqual(':');
  });
  it('should remove a hex colon', function () {
    const labelString = '\\x3A';

    const result = removeEscapes(labelString);
    expect(result).toEqual(':');
  });
  it('should remove a oct colon', function () {
    const labelString = '\\72';

    const result = removeEscapes(labelString);
    expect(result).toEqual(':');
  });
  it('should remove a oct colon 3 numbers', function () {
    const labelString = '\\072';

    const result = removeEscapes(labelString);
    expect(result).toEqual(':');
  });
  it('should remove multiple colons 3 numbers', function () {
    const labelString = '\\072\\072\\72';

    const result = removeEscapes(labelString);
    expect(result).toEqual(':::');
  });
  it('should handle greater and smaller then', function () {
    const labelString = '\\74\\076';

    const result = removeEscapes(labelString);
    expect(result).toEqual('<>');
  });
  it('should handle letters', function () {
    const labelString = '\\u0073\\143ri\\x70\\u0074\\x3A';

    const result = removeEscapes(labelString);
    expect(result).toEqual('script:');
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
