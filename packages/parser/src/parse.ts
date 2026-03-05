import type { LangiumParser, ParseResult } from 'langium';

import type { Info, Packet, Pie, Architecture, GitGraph, Radar, Treemap } from './index.js';

export type DiagramAST = Info | Packet | Pie | Architecture | GitGraph | Radar;

const parsers: Record<string, LangiumParser> = {};
const initializers = {
  info: async () => {
    const { createInfoServices } = await import('./language/info/index.js');
    const parser = createInfoServices().Info.parser.LangiumParser;
    parsers.info = parser;
  },
  packet: async () => {
    const { createPacketServices } = await import('./language/packet/index.js');
    const parser = createPacketServices().Packet.parser.LangiumParser;
    parsers.packet = parser;
  },
  pie: async () => {
    const { createPieServices } = await import('./language/pie/index.js');
    const parser = createPieServices().Pie.parser.LangiumParser;
    parsers.pie = parser;
  },
  architecture: async () => {
    const { createArchitectureServices } = await import('./language/architecture/index.js');
    const parser = createArchitectureServices().Architecture.parser.LangiumParser;
    parsers.architecture = parser;
  },
  gitGraph: async () => {
    const { createGitGraphServices } = await import('./language/gitGraph/index.js');
    const parser = createGitGraphServices().GitGraph.parser.LangiumParser;
    parsers.gitGraph = parser;
  },
  radar: async () => {
    const { createRadarServices } = await import('./language/radar/index.js');
    const parser = createRadarServices().Radar.parser.LangiumParser;
    parsers.radar = parser;
  },
  treemap: async () => {
    const { createTreemapServices } = await import('./language/treemap/index.js');
    const parser = createTreemapServices().Treemap.parser.LangiumParser;
    parsers.treemap = parser;
  },
} as const;

export async function parse(diagramType: 'info', text: string): Promise<Info>;
export async function parse(diagramType: 'packet', text: string): Promise<Packet>;
export async function parse(diagramType: 'pie', text: string): Promise<Pie>;
export async function parse(diagramType: 'architecture', text: string): Promise<Architecture>;
export async function parse(diagramType: 'gitGraph', text: string): Promise<GitGraph>;
export async function parse(diagramType: 'radar', text: string): Promise<Radar>;
export async function parse(diagramType: 'treemap', text: string): Promise<Treemap>;

export async function parse<T extends DiagramAST>(
  diagramType: keyof typeof initializers,
  text: string
): Promise<T> {
  const initializer = initializers[diagramType];
  if (!initializer) {
    throw new Error(`Unknown diagram type: ${diagramType}`);
  }
  if (!parsers[diagramType]) {
    await initializer();
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
    const lexerErrors: string = result.lexerErrors
      .map((err) => {
        const line = err.line !== undefined && !isNaN(err.line) ? err.line : '?';
        const column = err.column !== undefined && !isNaN(err.column) ? err.column : '?';
        return `Lexer error on line ${line}, column ${column}: ${err.message}`;
      })
      .join('\n');
    const parserErrors: string = result.parserErrors
      .map((err) => {
        const line =
          err.token.startLine !== undefined && !isNaN(err.token.startLine)
            ? err.token.startLine
            : '?';
        const column =
          err.token.startColumn !== undefined && !isNaN(err.token.startColumn)
            ? err.token.startColumn
            : '?';
        return `Parse error on line ${line}, column ${column}: ${err.message}`;
      })
      .join('\n');
    super(`Parsing failed: ${lexerErrors} ${parserErrors}`);
  }
}
