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
  QuantumCircuitGrammarGeneratedModule as QuantumCircuitGeneratedModule,
} from '../generated/module.js';
import { QuantumCircuitTokenBuilder } from './tokenBuilder.js';

interface QuantumCircuitAddedServices {
  parser: {
    TokenBuilder: QuantumCircuitTokenBuilder;
    ValueConverter: CommonValueConverter;
  };
}

export type QuantumCircuitServices = LangiumCoreServices & QuantumCircuitAddedServices;

export const QuantumCircuitModule: Module<
  QuantumCircuitServices,
  PartialLangiumCoreServices & QuantumCircuitAddedServices
> = {
  parser: {
    TokenBuilder: () => new QuantumCircuitTokenBuilder(),
    ValueConverter: () => new CommonValueConverter(),
  },
};

export function createQuantumCircuitServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem
): {
  shared: LangiumSharedCoreServices;
  QuantumCircuit: QuantumCircuitServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const QuantumCircuit: QuantumCircuitServices = inject(
    createDefaultCoreModule({ shared }),
    QuantumCircuitGeneratedModule,
    QuantumCircuitModule
  );
  shared.ServiceRegistry.register(QuantumCircuit);
  return { shared, QuantumCircuit };
}