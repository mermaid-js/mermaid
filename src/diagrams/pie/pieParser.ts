import { createToken, EmbeddedActionsParser, Lexer } from 'chevrotain';
import { log } from '../../logger';
import pieDb from './pieDb';

const NewLine = createToken({
  name: 'NewLine',
  pattern: /\r?\n/,
});
const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

const Colon = createToken({ name: 'Colon', pattern: /:/ });
const Text = createToken({ name: 'Text', pattern: /[^\n\r"]+/ });
const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(:?[^\\"]|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
});
const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
});
// TODO: Fix
const Comment = createToken({
  name: 'Comment',
  pattern: /%%.*\n/,
  group: Lexer.SKIPPED,
});

const Pie = createToken({ name: 'Pie', pattern: /pie/i });
const ShowData = createToken({ name: 'ShowData', pattern: /showData/i });
const Title = createToken({ name: 'Title', pattern: /title/i });
const AccDescription = createToken({ name: 'AccDescription', pattern: /accDescr/i });
const AccTitle = createToken({ name: 'AccTitle', pattern: /accTitle/i });
const LeftCurly = createToken({ name: 'LeftCurly', pattern: /{/ });
const RightCurly = createToken({ name: 'RightCurly', pattern: /}/ });
// TODO: Figure out ordering of tokens
const allTokens = [
  NewLine,
  WhiteSpace,
  Colon,
  LeftCurly,
  RightCurly,
  Comment,
  // Keywords
  Pie,
  ShowData,
  Title,
  AccTitle,
  AccDescription,
  // Literals
  NumberLiteral,
  StringLiteral,
  Text,
];
const PieLexer = new Lexer(allTokens);

class PieParser extends EmbeddedActionsParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public reset(): void {
    super.reset();
    pieDb.clear();
  }

  public diagram = this.RULE('diagram', () => {
    this.SUBRULE(this.header);
    this.OPTION(() => {
      this.SUBRULE(this.accTitle);
      this.CONSUME(NewLine);
    });
    this.OPTION2(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.accDescriptionSingleLine) },
        { ALT: () => this.SUBRULE(this.accDescriptionMultiLine) },
      ]);
      this.CONSUME2(NewLine);
    });
    this.AT_LEAST_ONE(() => {
      this.SUBRULE2(this.row);
    });
  });

  public header = this.RULE('header', () => {
    this.CONSUME(Pie);
    this.OPTION(() => {
      this.CONSUME(ShowData);
      this.ACTION(() => pieDb.setShowData(true));
    });
    this.OPTION2(() => {
      this.SUBRULE(this.title);
    });
    this.CONSUME(NewLine);
  });

  public title = this.RULE('title', () => {
    this.CONSUME(Title);
    const titleText = this.CONSUME(Text).image;
    this.ACTION(() => pieDb.setDiagramTitle(titleText));
  });

  public accTitle = this.RULE('accTitle', () => {
    this.CONSUME(AccTitle);
    this.CONSUME(Colon);
    const accTitleText = this.CONSUME(Text).image;
    this.ACTION(() => pieDb.setAccTitle(accTitleText));
  });

  public accDescriptionSingleLine = this.RULE('accDescriptionSingleLine', () => {
    this.CONSUME(AccDescription);
    this.CONSUME(Colon);
    const accDescrText = this.CONSUME(Text).image;
    this.ACTION(() => pieDb.setAccDescription(accDescrText));
  });

  public accDescriptionMultiLine = this.RULE('accDescriptionMultiLine', () => {
    this.CONSUME(AccDescription);
    this.CONSUME(LeftCurly);
    this.MANY(() => this.CONSUME(NewLine));

    const text: string[] = [];
    this.AT_LEAST_ONE(() => {
      const line = this.CONSUME(Text);
      text.push(line.image);
      this.MANY1(() => this.CONSUME2(NewLine));
    });
    this.CONSUME(RightCurly);
    this.ACTION(() => pieDb.setAccDescription(text.join('\n')));
  });

  public row = this.RULE('row', () => {
    this.SUBRULE(this.section);
    this.MANY(() => {
      this.CONSUME(NewLine);
    });
  });

  public section = this.RULE('section', () => {
    const quotedKey = this.CONSUME(StringLiteral).image;
    const key = quotedKey.slice(1, quotedKey.length - 1);
    this.CONSUME(Colon);
    const value = parseFloat(this.CONSUME(NumberLiteral).image);
    this.ACTION(() => pieDb.addSection(key, value));
  });
}

const parser = new PieParser();

const parse = (text: string): void => {
  const lexResult = PieLexer.tokenize(text);
  parser.input = lexResult.tokens;
  parser.diagram();

  if (parser.errors.length > 0 || lexResult.errors.length > 0) {
    log.error(
      { parserErrors: parser.errors, lexerErrors: lexResult.errors },
      'Error parsing info diagram'
    );
    throw new Error(`Parser errors: ${parser.errors} Lex errors: ${lexResult.errors}`);
  }
};

export default { parser: { parse }, parse };
