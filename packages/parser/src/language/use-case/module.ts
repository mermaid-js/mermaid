import type {
    DefaultSharedCoreModuleContext,
    LangiumCoreServices,
    LangiumSharedCoreServices,
  } from 'langium';
  import {
    EmptyFileSystem,
    createDefaultCoreModule,
    createDefaultSharedCoreModule,
    inject,
  } from 'langium';
  
  import { MermaidGeneratedSharedModule, UseCaseGeneratedModule } from '../generated/module.js';
  
  export function createUseCaseServices(
    context: DefaultSharedCoreModuleContext = EmptyFileSystem
  ): {
    shared: LangiumSharedCoreServices;
    UseCase: LangiumCoreServices;
  } {
    const shared = inject(
      createDefaultSharedCoreModule(context),
      MermaidGeneratedSharedModule
    );
    const UseCase = inject(
      createDefaultCoreModule({ shared }),
      UseCaseGeneratedModule
    );
    shared.ServiceRegistry.register(UseCase);
    return { shared, UseCase };
  }
  