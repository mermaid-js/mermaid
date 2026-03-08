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
import { CommonValueConverter } from '../common/valueConverter.js';
import {
  MermaidGeneratedSharedModule,
  VsmGrammarGeneratedModule as VsmGeneratedModule,
} from '../generated/module.js';
import { VsmTokenBuilder } from './tokenBuilder.js';

interface VsmAddedServices {
  parser: {
    TokenBuilder: VsmTokenBuilder;
    ValueConverter: CommonValueConverter;
  };
}

export type VsmServices = LangiumCoreServices & VsmAddedServices;

export const VsmModule: Module<VsmServices, PartialLangiumCoreServices & VsmAddedServices> = {
  parser: {
    TokenBuilder: () => new VsmTokenBuilder(),
    ValueConverter: () => new CommonValueConverter(),
  },
};

export function createVsmServices(context: DefaultSharedCoreModuleContext = EmptyFileSystem): {
  shared: LangiumSharedCoreServices;
  Vsm: VsmServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Vsm: VsmServices = inject(
    createDefaultCoreModule({ shared }),
    VsmGeneratedModule,
    VsmModule
  );
  shared.ServiceRegistry.register(Vsm);
  return { shared, Vsm };
}
