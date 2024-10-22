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
import { MermaidGeneratedSharedModule, EventModelGeneratedModule } from '../generated/module.js';

interface EventModelAddedServices {
  parser: {
    ValueConverter: CommonValueConverter;
  };
}

export type EventModelServices = LangiumCoreServices & EventModelAddedServices;

export const EventModelModule: Module<
  EventModelServices,
  PartialLangiumCoreServices & EventModelAddedServices
> = {
  parser: {
    ValueConverter: () => new CommonValueConverter(),
  },
};

export function createEventModelServices(
  context: DefaultSharedCoreModuleContext = EmptyFileSystem
): {
  shared: LangiumSharedCoreServices;
  EventModel: EventModelServices;
} {
  const shared: LangiumSharedCoreServices = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const EventModel: EventModelServices = inject(
    createDefaultCoreModule({ shared }),
    EventModelGeneratedModule,
    EventModelModule
  );
  shared.ServiceRegistry.register(EventModel);
  return { shared, EventModel };
}
