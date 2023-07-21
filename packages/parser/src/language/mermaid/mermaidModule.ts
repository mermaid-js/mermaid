import {
  DefaultSharedModuleContext,
  LangiumSharedServices,
  createDefaultSharedModule,
  inject,
} from 'langium';

import { MermaidGeneratedSharedModule } from '../generated/module.js';
import { MermaidServiceRegistry } from './mermaidServiceRegistry.js';
import { createInfoServices, createPieServices, createTimelineServices } from '../index.js';
import { createJourneyServices } from '../journey/journeyModule.js';

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
export function createMermaidServices(context: DefaultSharedModuleContext) {
  let shared: LangiumSharedServices = inject(
    createDefaultSharedModule(context),
    MermaidGeneratedSharedModule
  );
  shared = {
    ...shared,
    ServiceRegistry: new MermaidServiceRegistry(),
  };
  const { Info } = createInfoServices(context);
  shared.ServiceRegistry.register(Info);
  const { Journey } = createJourneyServices(context);
  shared.ServiceRegistry.register(Journey);
  const { Pie } = createPieServices(context);
  shared.ServiceRegistry.register(Pie);
  const { Timeline } = createTimelineServices(context);
  shared.ServiceRegistry.register(Timeline);
  return { Info, Journey, Pie, Timeline, shared };
}
