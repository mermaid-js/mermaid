const STICKY_FLAG = 'y';

/**
 * Check to see if text matches any of the given RegExps. Return true as soon
 * as there is a match. Use the sticky flag on all RegExps.
 *
 * @param text - the string to try to match
 * @param startingOffset - offset to start at
 * @param regexps - a list of RegExps to check for matches
 * @internal
 *
 * @returns true if the text matches any of the RegExps (with the sticky flag set),
 *    else returns false.
 */
export function matchAnyRegexps(text: string, startingOffset: number, regexps: RegExp[]): boolean {
  const found = false;
  for (const regexp of regexps) {
    const currentRegexp = new RegExp(regexp, regexp.flags + STICKY_FLAG);
    currentRegexp.lastIndex = startingOffset;
    if (currentRegexp.exec(text) !== null) {
      return true;
    }
  }
  return found;
}
