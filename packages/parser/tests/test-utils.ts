import { EmptyFileSystem, LangiumParser } from 'langium';

import {
  Info,
  InfoServices,
  Pie,
  PieServices,
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

const pieServices: PieServices = services.Pie;
const pieParser: LangiumParser = pieServices.parser.LangiumParser;
export function createPieTestServices() {
  const parse = (input: string) => {
    return pieParser.parse<Pie>(input);
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
