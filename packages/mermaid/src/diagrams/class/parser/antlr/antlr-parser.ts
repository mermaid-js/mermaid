import {
  BailErrorStrategy,
  CharStream,
  CommonTokenStream,
  ParseCancellationException,
  ParseTreeWalker,
  RecognitionException,
  type Token,
} from 'antlr4ng';
import { ClassParser } from './generated/ClassParser.js';
import { ClassLexer } from './generated/ClassLexer.js';
import { ClassVisitor } from './ClassVisitor.js';
import { ClassListener } from './ClassListener.js';
import type { ClassDbLike } from './ClassParserCore.js';

// Browser-safe environment variable access (same as sequence parser)
const getEnvVar = (name: string): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name];
    }
  } catch (_e) {
    // process is not defined in browser, continue to browser checks
  }

  // In browser, check for global variables
  if (typeof window !== 'undefined' && (window as any).MERMAID_CONFIG) {
    return (window as any).MERMAID_CONFIG[name];
  }
  return undefined;
};

class ANTLRClassParser {
  yy: ClassDbLike | null = null;

  parse(input: string): unknown {
    if (!this.yy) {
      throw new Error('Class ANTLR parser missing yy (database).');
    }

    // eslint-disable-next-line no-console
    console.log('🔧 ClassParser: USE_ANTLR_PARSER = true');
    // eslint-disable-next-line no-console
    console.log('🔧 ClassParser: Selected parser: ANTLR');

    this.yy.clear?.();

    const inputStream = CharStream.fromString(input);
    const lexer = new ClassLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new ClassParser(tokenStream);

    const anyParser = parser as unknown as {
      getErrorHandler?: () => unknown;
      setErrorHandler?: (handler: unknown) => void;
      errorHandler?: unknown;
    };
    const currentHandler = anyParser.getErrorHandler?.() ?? anyParser.errorHandler;
    const handlerName = (currentHandler as { constructor?: { name?: string } } | undefined)
      ?.constructor?.name;
    if (!currentHandler || handlerName !== 'BailErrorStrategy') {
      if (typeof anyParser.setErrorHandler === 'function') {
        anyParser.setErrorHandler(new BailErrorStrategy());
      } else {
        (parser as unknown as { errorHandler: unknown }).errorHandler = new BailErrorStrategy();
      }
    }

    try {
      const tree = parser.start();

      // Check if we should use Visitor or Listener pattern
      // Default to Visitor pattern (true) unless explicitly set to false
      const useVisitorPattern = getEnvVar('USE_ANTLR_VISITOR') !== 'false';

      // eslint-disable-next-line no-console
      console.log('🔧 ClassParser: Pattern =', useVisitorPattern ? 'Visitor' : 'Listener');

      if (useVisitorPattern) {
        const visitor = new ClassVisitor(this.yy);
        visitor.visit(tree);
      } else {
        const listener = new ClassListener(this.yy);
        ParseTreeWalker.DEFAULT.walk(listener, tree);
      }

      return tree;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ ANTLR Class Parser: Parse failed:', error);
      throw this.transformParseError(error, parser);
    }
  }

  private transformParseError(error: unknown, parser: ClassParser): Error {
    const recognitionError = this.unwrapRecognitionError(error);
    const offendingToken = this.resolveOffendingToken(recognitionError, parser);
    const line = offendingToken?.line ?? 0;
    const column = offendingToken?.column ?? 0;
    const message = `Parse error on line ${line}: Expecting 'STR'`;
    const cause = error instanceof Error ? error : undefined;
    const formatted = cause ? new Error(message, { cause }) : new Error(message);

    Object.assign(formatted, {
      hash: {
        line,
        loc: {
          first_line: line,
          last_line: line,
          first_column: column,
          last_column: column,
        },
        text: offendingToken?.text ?? '',
      },
    });

    return formatted;
  }

  private unwrapRecognitionError(error: unknown): RecognitionException | undefined {
    if (!error) {
      return undefined;
    }
    if (error instanceof RecognitionException) {
      return error;
    }
    if (error instanceof ParseCancellationException) {
      const cause = (error as { cause?: unknown }).cause;
      if (cause instanceof RecognitionException) {
        return cause;
      }
    }
    if (typeof error === 'object' && error !== null && 'cause' in error) {
      const cause = (error as { cause?: unknown }).cause;
      if (cause instanceof RecognitionException) {
        return cause;
      }
    }
    return undefined;
  }

  private resolveOffendingToken(
    error: RecognitionException | undefined,
    parser: ClassParser
  ): Token | undefined {
    const candidate = (error as { offendingToken?: Token })?.offendingToken;
    if (candidate) {
      return candidate;
    }

    const current = (
      parser as unknown as { getCurrentToken?: () => Token | undefined }
    ).getCurrentToken?.();
    if (current) {
      return current;
    }

    const stream = (
      parser as unknown as { _input?: { LT?: (offset: number) => Token | undefined } }
    )._input;
    return stream?.LT?.(1);
  }
}

const parserInstance = new ANTLRClassParser();

const exportedParser = {
  parse: (text: string) => parserInstance.parse(text),
  parser: parserInstance,
  yy: null as ClassDbLike | null,
};

Object.defineProperty(exportedParser, 'yy', {
  get() {
    return parserInstance.yy;
  },
  set(value: ClassDbLike | null) {
    parserInstance.yy = value;
  },
});

export default exportedParser;
