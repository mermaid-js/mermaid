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
  NeuralnetGrammarGeneratedModule as NeuralnetGeneratedModule,
} from '../generated/module.js';
import { CommonValueConverter } from '../common/index.js';

interface NeuralnetAddedServices {
  parser: {
    ValueConverter: CommonValueConverter;
  };
}

export type NeuralnetServices = LangiumCoreServices & NeuralnetAddedServices;

export const NeuralnetModule: Module<
  NeuralnetServices,
  PartialLangiumCoreServices & NeuralnetAddedServices
> = {
  parser: {
    ValueConverter: () => new CommonValueConverter(),
  },
};

export function createNeuralnetServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem
): {
  shared: LangiumSharedCoreServices;
  Neuralnet: NeuralnetServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Neuralnet: NeuralnetServices = inject(
    createDefaultCoreModule({ shared }),
    NeuralnetGeneratedModule,
    NeuralnetModule
  );
  shared.ServiceRegistry.register(Neuralnet);
  return { shared, Neuralnet };
}
