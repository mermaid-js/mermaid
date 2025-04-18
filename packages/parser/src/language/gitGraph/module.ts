import type {
  DefaultSharedCoreModuleContext,
  LangiumCoreServices,
  LangiumSharedCoreServices,
  Module,
  PartialLangiumCoreServices,
} from 'langium';
import {
  inject,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  EmptyFileSystem,
} from 'langium';
import { CommonValueConverter } from '../common/valueConverter.js';
import { MermaidGeneratedSharedModule, GitGraphGeneratedModule } from '../generated/module.js';
import { GitGraphTokenBuilder } from './tokenBuilder.js';

interface GitGraphAddedServices {
  parser: {
    TokenBuilder: GitGraphTokenBuilder;
    ValueConverter: CommonValueConverter;
  };
}

export type GitGraphServices = LangiumCoreServices & GitGraphAddedServices;

export const GitGraphModule: Module<
  GitGraphServices,
  PartialLangiumCoreServices & GitGraphAddedServices
> = {
  parser: {
    TokenBuilder: () => new GitGraphTokenBuilder(),
    ValueConverter: () => new CommonValueConverter(),
  },
};

export function createGitGraphServices(context: DefaultSharedCoreModuleContext = EmptyFileSystem): {
  shared: LangiumSharedCoreServices;
  GitGraph: GitGraphServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const GitGraph: GitGraphServices = inject(
    createDefaultCoreModule({ shared }),
    GitGraphGeneratedModule,
    GitGraphModule
  );
  shared.ServiceRegistry.register(GitGraph);
  return { shared, GitGraph };
}
