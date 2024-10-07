import type { CheckFitFunction, MarkdownLine, MarkdownWord, MarkdownWordType } from './types.js';

/**
 * Splits a string into graphemes if available, otherwise characters.
 * Utilizes `Intl.Segmenter` for better localization and fallback.
 */
export function splitTextToChars(text: string): string[] {
  // If Intl.Segmenter is supported, use it to split text into graphemes.
  if (Intl.Segmenter) {
    return [...new Intl.Segmenter().segment(text)].map((s) => s.segment); // Change: Locale-aware grapheme splitting.
  }
  return [...text]; // Fallback: Default character splitting.
}

/**
 * Splits a string into words using `Intl.Segmenter` if available or splitting by ' '.
 * `Intl.Segmenter` uses the default locale, which might vary across browsers.
 */
export function splitLineToWords(text: string): string[] {
  // If Intl.Segmenter is supported, use it to split text into words.
  if (Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'word' }).segment(text)].map(
      (s) => s.segment // Change: Locale-aware word splitting.
    );
  }
  
  // Fallback: Split by spaces, adding back spaces manually.
  const words = text.split(' ');
  const wordsWithSpaces = words.flatMap((s) => [s, ' ']).filter((s) => s);
  wordsWithSpaces.pop(); // Remove trailing space.
  return wordsWithSpaces;
}

/**
 * Splits a word into two parts, the first part that fits the width and the remaining part.
 * @param checkFit - Function to check if word fits within the width.
 * @param word - Word to split.
 * @returns [first part of word that fits, remaining part of word].
 */
export function splitWordToFitWidth(
  checkFit: CheckFitFunction,
  word: MarkdownWord
): [MarkdownWord, MarkdownWord] {
  const characters = splitTextToChars(word.content); // Use grapheme splitting.
  return splitWordToFitWidthRecursion(checkFit, [], characters, word.type); // Recursive splitting.
}

/**
 * Recursive helper for splitting words to fit within the width.
 */
function splitWordToFitWidthRecursion(
  checkFit: CheckFitFunction,
  usedChars: string[],
  remainingChars: string[],
  type: MarkdownWordType
): [MarkdownWord, MarkdownWord] {
  if (remainingChars.length === 0) {
    return [
      { content: usedChars.join(''), type },
      { content: '', type },
    ];
  }
  const [nextChar, ...rest] = remainingChars;
  const newWord = [...usedChars, nextChar];
  
  // Check if the word with the next character still fits.
  if (checkFit([{ content: newWord.join(''), type }])) {
    return splitWordToFitWidthRecursion(checkFit, newWord, rest, type); // Continue recursion.
  }

  // Handle edge case: If the first character doesn't fit, force split.
  if (usedChars.length === 0 && nextChar) {
    usedChars.push(nextChar);
    remainingChars.shift();
  }

  return [
    { content: usedChars.join(''), type },
    { content: remainingChars.join(''), type },
  ];
}

/**
 * Splits a line into multiple lines that satisfy the checkFit function.
 * @param line - Line to split.
 * @param checkFit - Function to check if the line fits within the width.
 * @returns Array of lines that fit within the width.
 */
export function splitLineToFitWidth(
  line: MarkdownLine,
  checkFit: CheckFitFunction
): MarkdownLine[] {
  // Error handling: Does not support lines with explicit newlines.
  if (line.some(({ content }) => content.includes('\n'))) {
    throw new Error('splitLineToFitWidth does not support newlines in the line');
  }
  return splitLineToFitWidthRecursion(line, checkFit); // Recursive line splitting.
}

/**
 * Recursive helper for splitting lines to fit within the width.
 */
function splitLineToFitWidthRecursion(
  words: MarkdownWord[],
  checkFit: CheckFitFunction,
  lines: MarkdownLine[] = [],
  newLine: MarkdownLine = []
): MarkdownLine[] {
  // Return if all words have been processed.
  if (words.length === 0) {
    if (newLine.length > 0) {
      lines.push(newLine); // Add the last line.
    }
    return lines.length > 0 ? lines : [];
  }

  let joiner = '';
  if (words[0].content === ' ') {
    joiner = ' ';
    words.shift();
  }

  const nextWord: MarkdownWord = words.shift() ?? { content: ' ', type: 'normal' };
  const lineWithNextWord: MarkdownLine = [...newLine];
  
  // Handle spaces between words.
  if (joiner !== '') {
    lineWithNextWord.push({ content: joiner, type: 'normal' });
  }
  lineWithNextWord.push(nextWord);

  // If the next word fits, continue adding to the line.
  if (checkFit(lineWithNextWord)) {
    return splitLineToFitWidthRecursion(words, checkFit, lines, lineWithNextWord);
  }

  // If nextWord doesn't fit, handle splitting.
  if (newLine.length > 0) {
    lines.push(newLine); // Add current line to lines.
    words.unshift(nextWord); // Push word back for processing.
  } else if (nextWord.content) {
    // If there was no content in newLine, split the nextWord.
    const [line, rest] = splitWordToFitWidth(checkFit, nextWord);
    lines.push([line]); // Add split part of the word.
    if (rest.content) {
      words.unshift(rest); // Reprocess remaining part of the word.
    }
  }

  return splitLineToFitWidthRecursion(words, checkFit, lines); // Continue recursion.
}
