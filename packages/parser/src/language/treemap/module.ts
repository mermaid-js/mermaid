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

import { MermaidGeneratedSharedModule, TreemapGeneratedModule } from '../generated/module.js';
import { TreemapTokenBuilder } from './tokenBuilder.js';
import { TreemapValueConverter } from './valueConverter.js';
import { TreemapValidator, registerValidationChecks } from './treemap-validator.js';

/**
 * Declaration of `Treemap` services.
 */
interface TreemapAddedServices {
  parser: {
    TokenBuilder: TreemapTokenBuilder;
    ValueConverter: TreemapValueConverter;
  };
  validation: {
    TreemapValidator: TreemapValidator;
  };
}

/**
 * Union of Langium default services and `Treemap` services.
 */
export type TreemapServices = LangiumCoreServices & TreemapAddedServices;

/**
 * Dependency injection module that overrides Langium default services and
 * contributes the declared `Treemap` services.
 */
export const TreemapModule: Module<
  TreemapServices,
  PartialLangiumCoreServices & TreemapAddedServices
> = {
  parser: {
    TokenBuilder: () => new TreemapTokenBuilder(),
    ValueConverter: () => new TreemapValueConverter(),
  },
  validation: {
    TreemapValidator: () => new TreemapValidator(),
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
export function createTreemapServices(context: DefaultSharedCoreModuleContext = EmptyFileSystem): {
  shared: LangiumSharedCoreServices;
  Treemap: TreemapServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Treemap: TreemapServices = inject(
    createDefaultCoreModule({ shared }),
    TreemapGeneratedModule,
    TreemapModule
  );
  shared.ServiceRegistry.register(Treemap);

  // Register validation checks
  registerValidationChecks(Treemap);

  return { shared, Treemap };
}
