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
  CynefinGrammarGeneratedModule as CynefinGeneratedModule,
} from '../generated/module.js';
import { CynefinTokenBuilder } from './tokenBuilder.js';

interface CynefinAddedServices {
  parser: {
    TokenBuilder: CynefinTokenBuilder;
    ValueConverter: CommonValueConverter;
  };
}

export type CynefinServices = LangiumCoreServices & CynefinAddedServices;

export const CynefinModule: Module<
  CynefinServices,
  PartialLangiumCoreServices & CynefinAddedServices
> = {
  parser: {
    TokenBuilder: () => new CynefinTokenBuilder(),
    ValueConverter: () => new CommonValueConverter(),
  },
};

export function createCynefinServices(context: DefaultSharedCoreModuleContext = EmptyFileSystem): {
  shared: LangiumSharedCoreServices;
  Cynefin: CynefinServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Cynefin: CynefinServices = inject(
    createDefaultCoreModule({ shared }),
    CynefinGeneratedModule,
    CynefinModule
  );
  shared.ServiceRegistry.register(Cynefin);
  return { shared, Cynefin };
}
