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

import { RailroadTokenBuilder } from './tokenBuilder.js';
import { RailroadValueConverter } from './valueConverter.js';
import {
  MermaidGeneratedSharedModule,
  RailroadGrammarGeneratedModule as RailroadGeneratedModule,
} from '../generated/module.js';

interface RailroadAddedServices {
  parser: {
    TokenBuilder: RailroadTokenBuilder;
    ValueConverter: RailroadValueConverter;
  };
}

export type RailroadServices = LangiumCoreServices & RailroadAddedServices;

export const RailroadModule: Module<
  RailroadServices,
  PartialLangiumCoreServices & RailroadAddedServices
> = {
  parser: {
    TokenBuilder: () => new RailroadTokenBuilder(),
    ValueConverter: () => new RailroadValueConverter(),
  },
};

export function createRailroadServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem
): {
  shared: LangiumSharedCoreServices;
  Railroad: RailroadServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Railroad: RailroadServices = inject(
    createDefaultCoreModule({ shared }),
    RailroadGeneratedModule,
    RailroadModule
  );
  shared.ServiceRegistry.register(Railroad);
  return { shared, Railroad };
}
