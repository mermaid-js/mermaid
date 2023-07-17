import {
  DefaultSharedModuleContext,
  LangiumServices,
  LangiumSharedServices,
  Module,
  PartialLangiumServices,
  createDefaultModule,
  createDefaultSharedModule,
  inject,
} from 'langium';

import { PieValueConverter } from './pieValueConverter.js';
import { PieTokenBuilder } from './pieTokenBuilder.js';
import { MermaidGeneratedSharedModule, PieGeneratedModule } from '../generated/module.js';

/**
 * Declaration of `Pie` services.
 */
export type PieAddedServices = {
  parser: {
    TokenBuilder: PieTokenBuilder;
    ValueConverter: PieValueConverter;
  };
};

/**
 * Union of Langium default services and `Pie` services.
 */
export type PieServices = LangiumServices & PieAddedServices;

/**
 * Dependency injection module that overrides Langium default services and
 * contributes the declared `Pie` services.
 */
export const PieModule: Module<PieServices, PartialLangiumServices & PieAddedServices> = {
  parser: {
    TokenBuilder: () => new PieTokenBuilder(),
    ValueConverter: () => new PieValueConverter(),
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
export function createPieServices(context: DefaultSharedModuleContext): {
  shared: LangiumSharedServices;
  Pie: PieServices;
} {
  const shared = inject(createDefaultSharedModule(context), MermaidGeneratedSharedModule);
  const Pie = inject(createDefaultModule({ shared }), PieGeneratedModule, PieModule);
  shared.ServiceRegistry.register(Pie);
  return { shared, Pie };
}
