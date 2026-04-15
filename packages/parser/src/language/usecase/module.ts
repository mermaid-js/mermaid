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
  UsecaseGrammarGeneratedModule as UsecaseGeneratedModule,
} from '../generated/module.js';
import { UsecaseTokenBuilder } from './tokenBuilder.js';

/**
 * Declaration of `Usecase` services.
 */
interface UsecaseAddedServices {
  parser: {
    TokenBuilder: UsecaseTokenBuilder;
    ValueConverter: CommonValueConverter;
  };
}

/**
 * Union of Langium default services and `Usecase` services.
 */
export type UsecaseServices = LangiumCoreServices & UsecaseAddedServices;

/**
 * Dependency injection module that overrides Langium default services and
 * contributes the declared `Usecase` services.
 */
export const UsecaseModule: Module<
  UsecaseServices,
  PartialLangiumCoreServices & UsecaseAddedServices
> = {
  parser: {
    TokenBuilder: () => new UsecaseTokenBuilder(),
    ValueConverter: () => new CommonValueConverter(),
  },
};

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 * - Langium's default shared services (workspace, documents, etc.)
 * - The generated shared services from the Mermaid grammar.
 *
 * Then inject the language-specific services by merging three modules:
 * - Langium's default language services (parser, serializer, etc.)
 * - The generated language-specific services from the Usecase grammar.
 * - The custom `UsecaseModule` which contributes the token builder and value converter.
 */
export function createUsecaseServices(context: DefaultSharedCoreModuleContext = EmptyFileSystem): {
  shared: LangiumSharedCoreServices;
  Usecase: UsecaseServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Usecase: UsecaseServices = inject(
    createDefaultCoreModule({ shared }),
    UsecaseGeneratedModule,
    UsecaseModule
  );
  shared.ServiceRegistry.register(Usecase);
  return { shared, Usecase };
}
