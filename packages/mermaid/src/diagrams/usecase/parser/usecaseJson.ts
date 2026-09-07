export interface OrderedJsonObject {
  value: Record<string, unknown>;
  propertyOrder: Record<string, string[]>;
}

export class UsecaseJsonError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number
  ) {
    super(`${message} (line ${line}, column ${column})`);
    this.name = 'UsecaseJsonError';
  }
}

const locationAtOffset = (
  text: string,
  offset: number,
  startLine: number,
  startColumn: number
): { line: number; column: number } => {
  let line = startLine;
  let column = startColumn;
  const end = Math.min(Math.max(offset, 0), text.length);

  for (let index = 0; index < end; index++) {
    const character = text[index];
    if (character === '\r') {
      line++;
      column = 1;
    } else if (character === '\n') {
      if (index === 0 || text[index - 1] !== '\r') {
        line++;
        column = 1;
      }
    } else {
      column++;
    }
  }

  return { line, column };
};

const locationFromErrorMessage = (
  message: string,
  text: string,
  startLine: number,
  startColumn: number
): { line: number; column: number } | undefined => {
  const position = /\bposition (\d+)\b/u.exec(message);
  if (position) {
    return locationAtOffset(text, Number.parseInt(position[1], 10), startLine, startColumn);
  }

  const localLocation = /\bline (\d+) column (\d+)\b/u.exec(message);
  if (localLocation) {
    const localLine = Number.parseInt(localLocation[1], 10);
    const localColumn = Number.parseInt(localLocation[2], 10);
    return {
      line: startLine + localLine - 1,
      column: localLine === 1 ? startColumn + localColumn - 1 : localColumn,
    };
  }

  if (/unexpected end|end of json input/iu.test(message)) {
    return locationAtOffset(text, text.length, startLine, startColumn);
  }

  return undefined;
};

class JsonWalkError extends Error {
  constructor(public readonly offset: number) {
    super('Invalid JSON token');
  }
}

/**
 * Walks JSON tokens only after JSON.parse has authoritatively accepted or rejected the text.
 * Its output is property order on success and a portable diagnostic offset on failure.
 */
class PropertyOrderCollector {
  private offset = 0;
  readonly propertyOrder: Record<string, string[]> = {};

  constructor(private readonly text: string) {}

  collect(): Record<string, string[]> {
    this.skipWhitespace();
    this.collectValue('');
    this.skipWhitespace();
    if (this.offset !== this.text.length) {
      throw new JsonWalkError(this.offset);
    }
    return this.propertyOrder;
  }

  private collectValue(pointer: string): void {
    this.skipWhitespace();
    const character = this.text[this.offset];

    if (character === '{') {
      this.collectObject(pointer);
    } else if (character === '[') {
      this.collectArray(pointer);
    } else if (character === '"') {
      this.readString(false);
    } else if (character === 't') {
      this.consumeLiteral('true');
    } else if (character === 'f') {
      this.consumeLiteral('false');
    } else if (character === 'n') {
      this.consumeLiteral('null');
    } else if (character === '-' || (character >= '0' && character <= '9')) {
      this.consumeNumber();
    } else {
      throw new JsonWalkError(this.offset);
    }
  }

  private collectObject(pointer: string): void {
    this.offset++;
    const order: string[] = [];
    const seen = new Set<string>();
    this.propertyOrder[pointer] = order;
    this.skipWhitespace();

    if (this.text[this.offset] === '}') {
      this.offset++;
      return;
    }

    while (this.offset < this.text.length) {
      if (this.text[this.offset] !== '"') {
        throw new JsonWalkError(this.offset);
      }
      const property = this.readString(true);
      const propertyPointer = `${pointer}/${property.replaceAll('~', '~0').replaceAll('/', '~1')}`;

      if (seen.has(property)) {
        this.deletePointerSubtree(propertyPointer);
      } else {
        seen.add(property);
        order.push(property);
      }

      this.skipWhitespace();
      if (this.text[this.offset] !== ':') {
        throw new JsonWalkError(this.offset);
      }
      this.offset++;
      this.collectValue(propertyPointer);
      this.skipWhitespace();

      if (this.text[this.offset] === '}') {
        this.offset++;
        return;
      }
      if (this.text[this.offset] !== ',') {
        throw new JsonWalkError(this.offset);
      }

      this.offset++;
      this.skipWhitespace();
    }

    throw new JsonWalkError(this.offset);
  }

  private collectArray(pointer: string): void {
    this.offset++;
    this.skipWhitespace();

    if (this.text[this.offset] === ']') {
      this.offset++;
      return;
    }

    let index = 0;
    while (this.offset < this.text.length) {
      this.collectValue(`${pointer}/${index}`);
      index++;
      this.skipWhitespace();

      if (this.text[this.offset] === ']') {
        this.offset++;
        return;
      }
      if (this.text[this.offset] !== ',') {
        throw new JsonWalkError(this.offset);
      }

      this.offset++;
      this.skipWhitespace();
    }

    throw new JsonWalkError(this.offset);
  }

  private readString(decode: boolean): string {
    this.offset++;
    let value = '';

    while (this.offset < this.text.length) {
      const characterOffset = this.offset;
      const character = this.text[this.offset++];
      if (character === '"') {
        return value;
      }
      if (character.charCodeAt(0) < 0x20) {
        throw new JsonWalkError(characterOffset);
      }
      if (character !== '\\') {
        if (decode) {
          value += character;
        }
        continue;
      }

      const escapeOffset = this.offset;
      const escape = this.text[this.offset++];
      switch (escape) {
        case '"':
        case '\\':
        case '/':
          if (decode) {
            value += escape;
          }
          break;
        case 'b':
          if (decode) {
            value += '\b';
          }
          break;
        case 'f':
          if (decode) {
            value += '\f';
          }
          break;
        case 'n':
          if (decode) {
            value += '\n';
          }
          break;
        case 'r':
          if (decode) {
            value += '\r';
          }
          break;
        case 't':
          if (decode) {
            value += '\t';
          }
          break;
        case 'u': {
          const codeUnit = this.text.slice(this.offset, this.offset + 4);
          if (!/^[\dA-Fa-f]{4}$/u.test(codeUnit)) {
            throw new JsonWalkError(this.offset);
          }
          if (decode) {
            value += String.fromCharCode(Number.parseInt(codeUnit, 16));
          }
          this.offset += 4;
          break;
        }
        default:
          throw new JsonWalkError(escapeOffset);
      }
    }

    throw new JsonWalkError(this.offset);
  }

  private consumeLiteral(literal: string): void {
    let index = 0;
    for (const element of literal) {
      if (this.text[this.offset + index] !== element) {
        throw new JsonWalkError(this.offset + index);
      }
      index++;
    }
    this.offset += literal.length;
  }

  private consumeNumber(): void {
    if (this.text[this.offset] === '-') {
      this.offset++;
    }

    if (this.text[this.offset] === '0') {
      this.offset++;
    } else if (this.text[this.offset] >= '1' && this.text[this.offset] <= '9') {
      while (this.text[this.offset] >= '0' && this.text[this.offset] <= '9') {
        this.offset++;
      }
    } else {
      throw new JsonWalkError(this.offset);
    }

    if (this.text[this.offset] === '.') {
      this.offset++;
      if (this.text[this.offset] < '0' || this.text[this.offset] > '9') {
        throw new JsonWalkError(this.offset);
      }
      while (this.text[this.offset] >= '0' && this.text[this.offset] <= '9') {
        this.offset++;
      }
    }

    if (this.text[this.offset] === 'e' || this.text[this.offset] === 'E') {
      this.offset++;
      if (this.text[this.offset] === '+' || this.text[this.offset] === '-') {
        this.offset++;
      }
      if (this.text[this.offset] < '0' || this.text[this.offset] > '9') {
        throw new JsonWalkError(this.offset);
      }
      while (this.text[this.offset] >= '0' && this.text[this.offset] <= '9') {
        this.offset++;
      }
    }
  }

  private skipWhitespace(): void {
    while (this.offset < this.text.length) {
      const character = this.text[this.offset];
      if (character !== ' ' && character !== '\t' && character !== '\n' && character !== '\r') {
        return;
      }
      this.offset++;
    }
  }

  private deletePointerSubtree(pointer: string): void {
    const descendantPrefix = `${pointer}/`;
    for (const existingPointer of Object.keys(this.propertyOrder)) {
      if (existingPointer === pointer || existingPointer.startsWith(descendantPrefix)) {
        delete this.propertyOrder[existingPointer];
      }
    }
  }
}

export function parseOrderedJsonObject(
  jsonText: string,
  startLine: number,
  startColumn: number
): OrderedJsonObject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    let location = locationFromErrorMessage(message, jsonText, startLine, startColumn);
    if (!location) {
      let invalidOffset = 0;
      try {
        new PropertyOrderCollector(jsonText).collect();
      } catch (walkError) {
        if (walkError instanceof JsonWalkError) {
          invalidOffset = walkError.offset;
        }
      }
      location = locationAtOffset(jsonText, invalidOffset, startLine, startColumn);
    }
    throw new UsecaseJsonError(`Invalid JSON: ${message}`, location.line, location.column);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new UsecaseJsonError('JSON value must have an object root', startLine, startColumn);
  }

  return {
    value: parsed as Record<string, unknown>,
    propertyOrder: new PropertyOrderCollector(jsonText).collect(),
  };
}
