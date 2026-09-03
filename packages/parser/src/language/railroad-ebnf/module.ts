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

import { RailroadEbnfTokenBuilder } from './tokenBuilder.js';
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

export const RailroadEbnfModule: Module<
  RailroadEbnfServices,
  PartialLangiumCoreServices & RailroadEbnfAddedServices
> = {
  parser: {
    TokenBuilder: () => new RailroadEbnfTokenBuilder(),
    ValueConverter: () => new RailroadEbnfValueConverter(),
  },
};

export function createRailroadEbnfServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem
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
    RailroadEbnfModule
  );
  shared.ServiceRegistry.register(RailroadEbnf);
  return { shared, RailroadEbnf };
}
