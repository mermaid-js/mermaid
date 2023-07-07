export const prepareTextForParsing = (text: string): string => {
  const textToParse = text
    .replaceAll(/^[^\S\n\r]+|[^\S\n\r]+$/g, '') // remove all trailing spaces for each row
    .replaceAll(/([\n\r])+/g, '\n') // remove empty lines duplicated
    .trim();

  return textToParse;
};
