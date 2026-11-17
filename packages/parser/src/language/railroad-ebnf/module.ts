import type {
  DefaultSharedCoreModuleContext,
  LangiumCoreServices,
  LangiumSharedCoreServices,
  Module,
  PartialLangiumCoreServices,
} from 'langium';
import {
  EmptyFileSystem,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  inject,
} from 'langium';

import { RailroadEbnfTokenBuilder, type RailroadEbnfStandard } from './tokenBuilder.js';
import { RailroadEbnfValueConverter } from './valueConverter.js';
import {
  MermaidGeneratedSharedModule,
  RailroadEbnfGrammarGeneratedModule as RailroadEbnfGeneratedModule,
} from '../generated/module.js';

interface RailroadEbnfAddedServices {
  parser: {
    TokenBuilder: RailroadEbnfTokenBuilder;
    ValueConverter: RailroadEbnfValueConverter;
  };
}

export type RailroadEbnfServices = LangiumCoreServices & RailroadEbnfAddedServices;

type RailroadEbnfModuleType = Module<
  RailroadEbnfServices,
  PartialLangiumCoreServices & RailroadEbnfAddedServices
>;

const createRailroadEbnfModule = (standard?: RailroadEbnfStandard): RailroadEbnfModuleType => ({
  parser: {
    TokenBuilder: () => new RailroadEbnfTokenBuilder(standard),
    ValueConverter: () => new RailroadEbnfValueConverter(),
  },
});

export const RailroadEbnfModule: RailroadEbnfModuleType = createRailroadEbnfModule();

export function createRailroadEbnfServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem,
  standard?: RailroadEbnfStandard
): {
  shared: LangiumSharedCoreServices;
  RailroadEbnf: RailroadEbnfServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const RailroadEbnf: RailroadEbnfServices = inject(
    createDefaultCoreModule({ shared }),
    RailroadEbnfGeneratedModule,
    createRailroadEbnfModule(standard)
  );
  shared.ServiceRegistry.register(RailroadEbnf);
  return { shared, RailroadEbnf };
}
