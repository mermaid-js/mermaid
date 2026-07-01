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

import { RailroadPegTokenBuilder } from './tokenBuilder.js';
import { RailroadPegValueConverter } from './valueConverter.js';
import {
  MermaidGeneratedSharedModule,
  RailroadPegGrammarGeneratedModule as RailroadPegGeneratedModule,
} from '../generated/module.js';

interface RailroadPegAddedServices {
  parser: {
    TokenBuilder: RailroadPegTokenBuilder;
    ValueConverter: RailroadPegValueConverter;
  };
}

export type RailroadPegServices = LangiumCoreServices & RailroadPegAddedServices;

export const RailroadPegModule: Module<
  RailroadPegServices,
  PartialLangiumCoreServices & RailroadPegAddedServices
> = {
  parser: {
    TokenBuilder: () => new RailroadPegTokenBuilder(),
    ValueConverter: () => new RailroadPegValueConverter(),
  },
};

export function createRailroadPegServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem
): {
  shared: LangiumSharedCoreServices;
  RailroadPeg: RailroadPegServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const RailroadPeg: RailroadPegServices = inject(
    createDefaultCoreModule({ shared }),
    RailroadPegGeneratedModule,
    RailroadPegModule
  );
  shared.ServiceRegistry.register(RailroadPeg);
  return { shared, RailroadPeg };
}
