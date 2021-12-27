import { removeScript, removeEscapes } from './common';

describe('when securityLevel is antiscript, all script must be removed', function () {
  it('should remove all script block, script inline.', function () {
    const labelString = `1
		Act1: Hello 1<script src="http://abc.com/script1.js"></script>1
		<b>Act2</b>:
		1<script>
			alert('script run......');
		</script>1
	1`;

    const result = removeScript(labelString);
    const hasScript = result.indexOf('script') >= 0;
    expect(hasScript).toEqual(false);

    const exactlyString = `1
		Act1: Hello 11
		<b>Act2</b>:
		11
	1`;

    const isEqual = result == exactlyString;
    expect(isEqual).toEqual(true);
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
