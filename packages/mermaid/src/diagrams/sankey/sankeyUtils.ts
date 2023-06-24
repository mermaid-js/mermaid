export const prepareTextForParsing = (text: string): string => {
  const textToParse = text
    .replaceAll(/^[^\S\n\r]+|[^\S\n\r]+$/g, '') // remove all trailing spaces for each row
    .replaceAll(/([\n\r])+/g, '\n') // remove empty lines duplicated
    .trim();

  return textToParse;
};

export class Uid {
  private static count = 0;
  id: string;
  href: string;

  public static next(name: string): Uid {
    return new Uid(name + ++Uid.count);
  }

  constructor(id: string) {
    this.id = id;
    this.href = `#${id}`;
  }

  toString(): string {
    return 'url(' + this.href + ')';
  }
}