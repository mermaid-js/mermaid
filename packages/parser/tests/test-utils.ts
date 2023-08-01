import { EmptyFileSystem, LangiumParser } from 'langium';

import {
  Info,
  InfoServices,
  Journey,
  JourneyServices,
  Mindmap,
  MindmapServices,
  Pie,
  PieServices,
  Sankey,
  SankeyServices,
  Timeline,
  TimelineServices,
  createMermaidServices,
} from '../src/language/index.js';

const services = createMermaidServices(EmptyFileSystem);

const infoServices: InfoServices = services.Info;
const infoParser: LangiumParser = infoServices.parser.LangiumParser;
export function createInfoTestServices() {
  const parse = (input: string) => {
    return infoParser.parse<Info>(input);
  };

  return { services, parse };
}

const journeyServices: JourneyServices = services.Journey;
const journeyParser: LangiumParser = journeyServices.parser.LangiumParser;
export function createJourneyTestServices() {
  const parse = (input: string) => {
    return journeyParser.parse<Journey>(input);
  };

  return { services, parse };
}

const mindmapServices: MindmapServices = services.Mindmap;
const mindmapParser: LangiumParser = mindmapServices.parser.LangiumParser;
export function createMindmapTestServices() {
  const parse = (input: string) => {
    return mindmapParser.parse<Mindmap>(input);
  };

  return { services, parse };
}

const pieServices: PieServices = services.Pie;
const pieParser: LangiumParser = pieServices.parser.LangiumParser;
export function createPieTestServices() {
  const parse = (input: string) => {
    return pieParser.parse<Pie>(input);
  };

  return { services, parse };
}

const sankeyServices: SankeyServices = services.Sankey;
const sankeyParser: LangiumParser = sankeyServices.parser.LangiumParser;
export function createSankeyTestServices() {
  const parse = (input: string) => {
    return sankeyParser.parse<Sankey>(input);
  };

  return { services, parse };
}

const timelineServices: TimelineServices = services.Timeline;
const timelineParser: LangiumParser = timelineServices.parser.LangiumParser;
export function createTimelineTestServices() {
  const parse = (input: string) => {
    return timelineParser.parse<Timeline>(input);
  };

  return { services, parse };
}
