import { type DefaultSharedCoreModuleContext, type LangiumCoreServices } from 'langium';
import type { Module, PartialLangiumCoreServices } from 'langium';
import { EmptyFileSystem } from 'langium';
import { UsecaseTokenBuilder } from './tokenBuilder.js';
import { UsecaseValueConverter } from './valueConverter.js';
import { UsecaseValidator } from './usecase-validator.js';

interface UsecaseAddedServices {
  parser: {
    TokenBuilder: UsecaseTokenBuilder;
    ValueConverter: UsecaseValueConverter;
  };
  validation: {
    UsecaseValidator: UsecaseValidator;
  };
}

export type UsecaseServices = LangiumCoreServices & UsecaseAddedServices;

export const UsecaseModule: Module<
  UsecaseServices,
  PartialLangiumCoreServices & UsecaseAddedServices
> = {
  parser: {
    TokenBuilder: () => new UsecaseTokenBuilder(),
    ValueConverter: () => new UsecaseValueConverter(),
  },
  validation: {
    UsecaseValidator: () => new UsecaseValidator(),
  },
};

export function createUsecaseServices(_context: DefaultSharedCoreModuleContext = EmptyFileSystem) {
  // TODO
}
