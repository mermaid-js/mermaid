import { type AstNode, type LangiumParser, type ParseResult, createLangiumParser } from 'langium';

import type { JourneyServices } from './journeyModule.js';
import type { JourneyTask, Journey, JourneySection } from '../generated/ast.js';

function insertActors(actors: Set<string>, tasks: JourneyTask[]): void {
  tasks.forEach((task: JourneyTask): void => {
    task.actors.forEach((actor: string): void => {
      if (!actors.has(actor)) {
        actors.add(actor);
      }
    });
  });
}

export function createJourneyParser(services: JourneyServices): LangiumParser {
  const parser: LangiumParser = createLangiumParser(services);
  const parse: <T extends AstNode = AstNode>(input: string) => ParseResult<T> =
    parser.parse.bind(parser);
  parser.parse = <T extends AstNode = AstNode>(input: string): ParseResult<T> => {
    const parseResult: ParseResult<T> = parse<T>(input);

    const journeyValue: Journey = parseResult.value as unknown as Journey;

    const actors: Set<string> = new Set<string>();
    journeyValue.sections.forEach((section: JourneySection) => {
      insertActors(actors, section.tasks);
    });
    insertActors(actors, journeyValue.tasks);
    journeyValue.actors = [...actors].sort();

    return parseResult;
  };
  return parser;
}
