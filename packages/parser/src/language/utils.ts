import type { CustomPatternMatcherFunc } from './chevrotainWrapper.js';

export function regexPatternFunc(regex: RegExp): CustomPatternMatcherFunc {
  const stickyRegex = new RegExp(regex, regex.flags + 'y');
  return (text, offset) => {
    stickyRegex.lastIndex = offset;
    const execResult = stickyRegex.exec(text);
    return execResult;
  };
}
