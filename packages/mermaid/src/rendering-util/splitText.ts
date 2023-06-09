export type CheckFitFunction = (text: string) => boolean;

/**
 * Splits a string into graphemes if available, otherwise characters.
 */
export function splitTextToChars(text: string): string[] {
  if (Intl.Segmenter) {
    return [...new Intl.Segmenter().segment(text)].map((s) => s.segment);
  }
  return [...text];
}

export function splitWordToFitWidth(checkFit: CheckFitFunction, word: string): string[] {
  console.error('splitWordToFitWidth', word);
  const characters = splitTextToChars(word);
  if (characters.length === 0) {
    return [];
  }
  const newWord = [];
  let lastCheckedCharacter = '';
  while (characters.length > 0) {
    lastCheckedCharacter = characters.shift() ?? ' ';
    if (checkFit([...newWord, lastCheckedCharacter].join(''))) {
      newWord.push(lastCheckedCharacter);
    } else if (newWord.length === 0) {
      // Even the first character was too long, we cannot split it, so return it as is.
      // This is an edge case that can happen when the first character is a long grapheme.
      return [lastCheckedCharacter, characters.join('')];
    } else {
      // The last character was too long, so we need to put it back and return the rest.
      characters.unshift(lastCheckedCharacter);
      break;
    }
  }
  if (characters.length === 0) {
    return [newWord.join('')];
  }
  console.error({ newWord, characters });
  return [newWord.join(''), ...splitWordToFitWidth(checkFit, characters.join(''))];
}

export function splitWordToFitWidth2(checkFit: CheckFitFunction, word: string): [string, string] {
  console.error('splitWordToFitWidth2', word);
  const characters = splitTextToChars(word);
  if (characters.length === 0) {
    return ['', ''];
  }
  const newWord = [];
  let lastCheckedCharacter = '';
  while (characters.length > 0) {
    lastCheckedCharacter = characters.shift() ?? ' ';
    if (checkFit([...newWord, lastCheckedCharacter].join(''))) {
      newWord.push(lastCheckedCharacter);
    } else if (newWord.length === 0) {
      // Even the first character was too long, we cannot split it, so return it as is.
      // This is an edge case that can happen when the first character is a long grapheme.
      return [lastCheckedCharacter, characters.join('')];
    } else {
      // The last character was too long, so we need to put it back and return the rest.
      characters.unshift(lastCheckedCharacter);
      break;
    }
  }
  console.error({ newWord, characters });
  return [newWord.join(''), characters.join('')];
}

export function splitLineToFitWidth(
  words: string[],
  checkFit: CheckFitFunction,
  lines: string[] = [],
  popped: string[] = []
): string[] {
  console.error('splitLineToFitWidth', { words, lines, popped });
  // Return if there is nothing left to split
  if (words.length === 0 && popped.length === 0) {
    return lines;
  }
  const remainingText = words.join(' ');
  if (checkFit(remainingText)) {
    lines.push(remainingText);
    words = [...popped];
  }
  if (words.length > 1) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    popped.unshift(words.pop()!);
    return splitLineToFitWidth(words, checkFit, lines, popped);
  } else if (words.length === 1) {
    const [word, rest] = splitWordToFitWidth(checkFit, words[0]);
    lines.push(word);
    console.error({ word, rest });
    if (rest) {
      return splitLineToFitWidth([rest], checkFit, lines, []);
    }
  }
  return lines;
}

export function splitLineToFitWidthLoop(words: string[], checkFit: CheckFitFunction): string[] {
  console.error('splitLineToFitWidthLoop', { words });
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let newLine: string[] = [];
  let lastCheckedWord = '';
  while (words.length > 0) {
    lastCheckedWord = words.shift() ?? ' ';
    console.error({ lastCheckedWord, words });
    if (checkFit([...newLine, lastCheckedWord].join(' '))) {
      newLine.push(lastCheckedWord);
    } else {
      console.error({ newLine });
      if (newLine.length === 0) {
        const [word, rest] = splitWordToFitWidth2(checkFit, lastCheckedWord);
        console.error({ word, rest });
        lines.push(word);
        if (rest) {
          words.unshift(rest);
        }
      } else {
        words.unshift(lastCheckedWord);
        lines.push(newLine.join(' '));
        newLine = [];
      }
    }
    console.error({ newLine, lastCheckedWord, words, lines });
  }
  if (newLine.length > 0) {
    lines.push(newLine.join(' '));
  }
  console.error({ newLine, lastCheckedWord, words, lines });
  return lines;
}
