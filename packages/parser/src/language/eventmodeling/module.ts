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
import { EventModelingValidator, registerValidationChecks } from './event-modeling-validator.js';

interface EventModelingAddedServices {
  parser: {
    TokenBuilder: EventModelingTokenBuilder;
    ValueConverter: CommonValueConverter;
  };
  validation: {
    EventModelingValidator: EventModelingValidator;
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
  validation: {
    EventModelingValidator: () => new EventModelingValidator(),
  },
};

export function createEventModelingServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem
): {
  shared: LangiumSharedCoreServices;
  EventModel: EventModelingServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const EventModel: EventModelingServices = inject(
    createDefaultCoreModule({ shared }),
    EventModelingGeneratedModule,
    EventModelingModule
  );
  shared.ServiceRegistry.register(EventModel);
  registerValidationChecks(EventModel);
  return { shared, EventModel };
}
