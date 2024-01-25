import type { LangiumParser, ParseResult } from 'langium';

import type { Info, Packet, Pie } from './index.js';
import { createInfoServices, createPacketServices, createPieServices } from './language/index.js';

export type DiagramAST = Info | Packet | Pie;

const parsers: Record<string, LangiumParser> = {};
const initializers = {
  info: () => {
    // Will have to make parse async to use this. Can try later...
    // const { createInfoServices } = await import('./language/info/index.js');
    parsers['info'] = createInfoServices().Info.parser.LangiumParser;
  },
  packet: () => {
    parsers['packet'] = createPacketServices().Packet.parser.LangiumParser;
  },
  pie: () => {
    parsers['pie'] = createPieServices().Pie.parser.LangiumParser;
  },
} as const;

export function parse(diagramType: 'info', text: string): Info;
export function parse(diagramType: 'packet', text: string): Packet;
export function parse(diagramType: 'pie', text: string): Pie;
export function parse<T extends DiagramAST>(
  diagramType: keyof typeof initializers,
  text: string
): T {
  const initializer = initializers[diagramType];
  if (!initializer) {
    throw new Error(`Unknown diagram type: ${diagramType}`);
  }
  if (!parsers[diagramType]) {
    initializer();
  }
  const parser: LangiumParser = parsers[diagramType];
  const result: ParseResult<T> = parser.parse<T>(text);
  if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
    throw new MermaidParseError(result);
  }
  return result.value;
}

export class MermaidParseError extends Error {
  constructor(public result: ParseResult<DiagramAST>) {
    const lexerErrors: string = result.lexerErrors.map((err) => err.message).join('\n');
    const parserErrors: string = result.parserErrors.map((err) => err.message).join('\n');
    super(`Parsing failed: ${lexerErrors} ${parserErrors}`);
  }
}
