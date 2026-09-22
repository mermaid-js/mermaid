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

import { RailroadAbnfTokenBuilder } from './tokenBuilder.js';
import { RailroadAbnfValueConverter } from './valueConverter.js';
import {
  MermaidGeneratedSharedModule,
  RailroadAbnfGrammarGeneratedModule as RailroadAbnfGeneratedModule,
} from '../generated/module.js';

interface RailroadAbnfAddedServices {
  parser: {
    TokenBuilder: RailroadAbnfTokenBuilder;
    ValueConverter: RailroadAbnfValueConverter;
  };
}

export type RailroadAbnfServices = LangiumCoreServices & RailroadAbnfAddedServices;

export const RailroadAbnfModule: Module<
  RailroadAbnfServices,
  PartialLangiumCoreServices & RailroadAbnfAddedServices
> = {
  parser: {
    TokenBuilder: () => new RailroadAbnfTokenBuilder(),
    ValueConverter: () => new RailroadAbnfValueConverter(),
  },
};

export function createRailroadAbnfServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem
): {
  shared: LangiumSharedCoreServices;
  RailroadAbnf: RailroadAbnfServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const RailroadAbnf: RailroadAbnfServices = inject(
    createDefaultCoreModule({ shared }),
    RailroadAbnfGeneratedModule,
    RailroadAbnfModule
  );
  shared.ServiceRegistry.register(RailroadAbnf);
  return { shared, RailroadAbnf };
}
