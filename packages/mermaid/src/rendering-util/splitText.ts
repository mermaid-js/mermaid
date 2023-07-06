import type { CheckFitFunction, MarkdownLine, MarkdownWord, MarkdownWordType } from './types.js';

/**
 * Splits a string into graphemes if available, otherwise characters.
 */
export function splitTextToChars(text: string): string[] {
  if (Intl.Segmenter) {
    return [...new Intl.Segmenter().segment(text)].map((s) => s.segment);
  }
  return [...text];
}

/**
 * Splits a string into words.
 */
export function splitLineToWords(text: string): string[] {
  if (Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'word' }).segment(text)].map(
      (s) => s.segment
    );
  }
  // Split by ' ' removes the ' 's from the result.
  const words = text.split(' ');
  // Add the ' 's back to the result.
  const wordsWithSpaces = words.flatMap((s) => [s, ' ']);
  // Remove last space.
  wordsWithSpaces.pop();
  return wordsWithSpaces;
}

/**
 * Splits a word into two parts, the first part fits the width and the remaining part.
 * @param checkFit - Function to check if word fits
 * @param word - Word to split
 * @returns [first part of word that fits, rest of word]
 */
export function splitWordToFitWidth(
  checkFit: CheckFitFunction,
  word: MarkdownWord
): [MarkdownWord, MarkdownWord] {
  const characters = splitTextToChars(word.content);
  if (characters.length === 0) {
    return [
      { content: '', type: word.type },
      { content: '', type: word.type },
    ];
  }
  return splitWordToFitWidthRecursion(checkFit, [], characters, word.type);
}

function splitWordToFitWidthRecursion(
  checkFit: CheckFitFunction,
  usedChars: string[],
  remainingChars: string[],
  type: MarkdownWordType
): [MarkdownWord, MarkdownWord] {
  // eslint-disable-next-line no-console
  console.error({ usedChars, remainingChars });
  if (remainingChars.length === 0) {
    return [
      { content: usedChars.join(''), type },
      { content: '', type },
    ];
  }
  const [nextChar, ...rest] = remainingChars;
  const newWord = [...usedChars, nextChar];
  if (checkFit([{ content: newWord.join(''), type }])) {
    return splitWordToFitWidthRecursion(checkFit, newWord, rest, type);
  }
  return [
    { content: usedChars.join(''), type },
    { content: remainingChars.join(''), type },
  ];
}

export function splitLineToFitWidth(
  line: MarkdownLine,
  checkFit: CheckFitFunction
): MarkdownLine[] {
  if (line.some(({ content }) => content.includes('\n'))) {
    throw new Error('splitLineToFitWidth does not support newlines in the line');
  }
  return splitLineToFitWidthRecursion(line, checkFit);
}

function splitLineToFitWidthRecursion(
  words: MarkdownWord[],
  checkFit: CheckFitFunction,
  lines: MarkdownLine[] = [],
  newLine: MarkdownLine = []
): MarkdownLine[] {
  // eslint-disable-next-line no-console
  console.error({ words, lines, newLine });
  // Return if there is nothing left to split
  if (words.length === 0) {
    // If there is a new line, add it to the lines
    if (newLine.length > 0) {
      lines.push(newLine);
    }
    return lines.length > 0 ? lines : [];
  }
  let joiner = '';
  if (words[0].content === ' ') {
    joiner = ' ';
    words.shift();
  }
  const nextWord: MarkdownWord = words.shift() ?? { content: ' ', type: 'normal' };

  // const nextWordWithJoiner: MarkdownWord = { ...nextWord, content: joiner + nextWord.content };
  const lineWithNextWord: MarkdownLine = [...newLine];
  if (joiner !== '') {
    lineWithNextWord.push({ content: joiner, type: 'normal' });
  }
  lineWithNextWord.push(nextWord);

  if (checkFit(lineWithNextWord)) {
    // nextWord fits, so we can add it to the new line and continue
    return splitLineToFitWidthRecursion(words, checkFit, lines, lineWithNextWord);
  }

  // nextWord doesn't fit, so we need to split it
  if (newLine.length > 0) {
    // There was text in newLine, so add it to lines and push nextWord back into words.
    lines.push(newLine);
    words.unshift(nextWord);
  } else {
    // There was no text in newLine, so we need to split nextWord
    const [line, rest] = splitWordToFitWidth(checkFit, nextWord);
    lines.push([line]);
    words.unshift(rest);
  }
  return splitLineToFitWidthRecursion(words, checkFit, lines);
}
