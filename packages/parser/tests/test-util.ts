import type { LangiumParser, ParseResult } from 'langium';
import { expect, vi } from 'vitest';
import type {
  Info,
  InfoServices,
  Pie,
  PieServices,
  Radar,
  RadarServices,
  Packet,
  PacketServices,
  GitGraph,
  GitGraphServices,
} from '../src/language/index.js';
import {
  createInfoServices,
  createPieServices,
  createRadarServices,
  createPacketServices,
  createGitGraphServices,
} from '../src/language/index.js';

const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

/**
 * A helper test function that validate that the result doesn't have errors
 * or any ambiguous alternatives from chevrotain.
 *
 * @param result - the result `parse` function.
 */
export function expectNoErrorsOrAlternatives(result: ParseResult) {
  expect(result.lexerErrors).toHaveLength(0);
  expect(result.parserErrors).toHaveLength(0);

  expect(consoleMock).not.toHaveBeenCalled();
  consoleMock.mockReset();
}

const infoServices: InfoServices = createInfoServices().Info;
const infoParser: LangiumParser = infoServices.parser.LangiumParser;
export function createInfoTestServices() {
  const parse = (input: string) => {
    return infoParser.parse<Info>(input);
  };

  return { services: infoServices, parse };
}
export const infoParse = createInfoTestServices().parse;

const pieServices: PieServices = createPieServices().Pie;
const pieParser: LangiumParser = pieServices.parser.LangiumParser;
export function createPieTestServices() {
  const parse = (input: string) => {
    return pieParser.parse<Pie>(input);
  };

  return { services: pieServices, parse };
}
export const pieParse = createPieTestServices().parse;

const packetServices: PacketServices = createPacketServices().Packet;
const packetParser: LangiumParser = packetServices.parser.LangiumParser;
export function createPacketTestServices() {
  const parse = (input: string) => {
    return packetParser.parse<Packet>(input);
  };

  return { services: packetServices, parse };
}
export const packetParse = createPacketTestServices().parse;

const radarServices: RadarServices = createRadarServices().Radar;
const radarParser: LangiumParser = radarServices.parser.LangiumParser;
export function createRadarTestServices() {
  const parse = (input: string) => {
    return radarParser.parse<Radar>(input);
  };

  return { services: radarServices, parse };
}
export const radarParse = createRadarTestServices().parse;

const gitGraphServices: GitGraphServices = createGitGraphServices().GitGraph;
const gitGraphParser: LangiumParser = gitGraphServices.parser.LangiumParser;
export function createGitGraphTestServices() {
  const parse = (input: string) => {
    return gitGraphParser.parse<GitGraph>(input);
  };

  return { services: gitGraphServices, parse };
}
export const gitGraphParse = createGitGraphTestServices().parse;
