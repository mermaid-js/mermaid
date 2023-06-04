import { ValidationChecks } from 'langium';

import type { MermaidAstType, MermaidServices } from '../index.js';

/**
 * Register custom validation checks.
 * @param services - services
 */
export function registerValidationChecks(services: MermaidServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation;
  const checks: ValidationChecks<MermaidAstType> = {};
  registry.register(checks, validator);
}
