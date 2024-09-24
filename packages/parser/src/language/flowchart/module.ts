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
import { MermaidGeneratedSharedModule, FlowchartGeneratedModule } from '../generated/module.js';
import { FlowchartTokenBuilder } from './tokenBuilder.js';

interface FlowchartAddedServices {
  parser: {
    TokenBuilder: FlowchartTokenBuilder;
    ValueConverter: CommonValueConverter;
  };
}

export type FlowchartServices = LangiumCoreServices & FlowchartAddedServices;

export const FlowchartModule: Module<
  FlowchartServices,
  PartialLangiumCoreServices & FlowchartAddedServices
> = {
  parser: {
    TokenBuilder: () => new FlowchartTokenBuilder(),
    ValueConverter: () => new CommonValueConverter(),
  },
};

export function createFlowchartServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem
): {
  shared: LangiumSharedCoreServices;
  Flowchart: FlowchartServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Flowchart: FlowchartServices = inject(
    createDefaultCoreModule({ shared }),
    FlowchartGeneratedModule,
    FlowchartModule
  );
  shared.ServiceRegistry.register(Flowchart);
  return { shared, Flowchart };
}
