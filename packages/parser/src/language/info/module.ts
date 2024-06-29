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

import { CommonValueConverter } from '../common/index.js';
import { InfoGeneratedModule, MermaidGeneratedSharedModule } from '../generated/module.js';
import { InfoTokenBuilder } from './tokenBuilder.js';

/**
 * Declaration of `Info` services.
 */
type InfoAddedServices = {
  parser: {
    TokenBuilder: InfoTokenBuilder;
    ValueConverter: CommonValueConverter;
  };
};

/**
 * Union of Langium default services and `Info` services.
 */
export type InfoServices = LangiumCoreServices & InfoAddedServices;

/**
 * Dependency injection module that overrides Langium default services and
 * contributes the declared `Info` services.
 */
export const InfoModule: Module<InfoServices, PartialLangiumCoreServices & InfoAddedServices> = {
  parser: {
    TokenBuilder: () => new InfoTokenBuilder(),
    ValueConverter: () => new CommonValueConverter(),
  },
};

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 * @param context - Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createInfoServices(context: DefaultSharedCoreModuleContext = EmptyFileSystem): {
  shared: LangiumSharedCoreServices;
  Info: InfoServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Info: InfoServices = inject(
    createDefaultCoreModule({ shared }),
    InfoGeneratedModule,
    InfoModule
  );
  shared.ServiceRegistry.register(Info);
  return { shared, Info };
}
