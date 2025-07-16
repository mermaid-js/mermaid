import type { LangiumParser, ParseResult } from 'langium';
import { expect, vi } from 'vitest';
import type {
  Architecture,
  ArchitectureServices,
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
  XY,
  XYServices,
} from '../src/language/index.js';
import {
  createArchitectureServices,
  createInfoServices,
  createPieServices,
  createRadarServices,
  createPacketServices,
  createGitGraphServices,
  createXYServices,
} from '../src/language/index.js';

const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

/**
 * A helper test function that validate that the result doesn't have errors
 * or any ambiguous alternatives from chevrotain.
 *
 * @param result - the result `parse` function.
 */
export function expectNoErrorsOrAlternatives(result: ParseResult) {
  expect.soft(result.lexerErrors).toHaveLength(0);
  expect.soft(result.parserErrors).toHaveLength(0);
  // To see what the error is, in the logs.
  expect(result.lexerErrors[0]).toBeUndefined();
  expect(consoleMock).not.toHaveBeenCalled();
  consoleMock.mockReset();
}

/**
 * A helper test function that validate that the result has errors
 * or any ambiguous alternatives from chevrotain.
 *
 * @param result - the result `parse` function.
 */
export function expectErrorsOrAlternatives(result: ParseResult) {
  expect(result.lexerErrors.length > 0 || result.parserErrors.length > 0).toBe(true);

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

const architectureServices: ArchitectureServices = createArchitectureServices().Architecture;
const architectureParser: LangiumParser = architectureServices.parser.LangiumParser;
export function createArchitectureTestServices() {
  const parse = (input: string) => {
    return architectureParser.parse<Architecture>(input);
  };

  return { services: architectureServices, parse };
}
export const architectureParse = createArchitectureTestServices().parse;

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

const xyServices: XYServices = createXYServices().XY;
const xyParser: LangiumParser = xyServices.parser.LangiumParser;
export function createXYTestServices() {
  const parse = (input: string) => {
    return xyParser.parse<XY>(input);
  };

  return { services: xyServices, parse };
}
export const xyParse = createXYTestServices().parse;
