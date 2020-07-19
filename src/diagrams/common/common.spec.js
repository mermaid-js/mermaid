import { removeScript } from './common';

describe('when securityLevel is antiscript, all script must be removed', function() {
  it('should remove all script block, script inline.', function() {
    const labelString = `1
		Act1: Hello 1<script src="http://abc.com/script1.js"></script>1
		<b>Act2</b>:
		1<script>
			alert('script run......');
		</script>1
	1`;

	const result = removeScript(labelString);
	const hasScript = (result.indexOf("script") >= 0);
    expect(hasScript).toEqual(false);

	const exactlyString = `1
		Act1: Hello 11
		<b>Act2</b>:
		11
	1`;

	const isEqual = (result == exactlyString);
    expect(isEqual).toEqual(true);
  });
});
