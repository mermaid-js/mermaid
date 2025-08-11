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
import { MermaidGeneratedSharedModule, EventModelingGeneratedModule } from '../generated/module.js';
import { EventModelingTokenBuilder } from './tokenBuilder.js';

interface EventModelingAddedServices {
  parser: {
    TokenBuilder: EventModelingTokenBuilder;
    ValueConverter: CommonValueConverter;
  };
}

export type EventModelingServices = LangiumCoreServices & EventModelingAddedServices;

export const EventModelingModule: Module<
  EventModelingServices,
  PartialLangiumCoreServices & EventModelingAddedServices
> = {
  parser: {
    TokenBuilder: () => new EventModelingTokenBuilder(),
    ValueConverter: () => new CommonValueConverter(),
  },
};

export function createEventModelingServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem
): {
  shared: LangiumSharedCoreServices;
  EventModeling: EventModelingServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const EventModeling: EventModelingServices = inject(
    createDefaultCoreModule({ shared }),
    EventModelingGeneratedModule,
    EventModelingModule
  );
  shared.ServiceRegistry.register(EventModeling);
  return { shared, EventModeling };
}
