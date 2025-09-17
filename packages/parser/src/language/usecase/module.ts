/**
 * ANTLR UseCase Module
 *
 * This module provides dependency injection and service creation
 * for the ANTLR-based UseCase parser, following the Langium pattern.
 */

import type { AntlrUsecaseServices } from './types.js';
import { UsecaseAntlrParser } from './parser.js';
import { UsecaseAntlrVisitor } from './visitor.js';

/**
 * ANTLR UseCase Module for dependency injection
 */
export const AntlrUsecaseModule = {
  parser: () => new UsecaseAntlrParser(),
  visitor: () => new UsecaseAntlrVisitor(),
};

/**
 * Create the full set of ANTLR UseCase services
 *
 * This follows the Langium pattern but for ANTLR services
 *
 * @returns An object with ANTLR UseCase services
 */
export function createAntlrUsecaseServices(): AntlrUsecaseServices {
  const parser = new UsecaseAntlrParser();
  const visitor = new UsecaseAntlrVisitor();

  return {
    parser,
    visitor,
  };
}

/**
 * Singleton instance of ANTLR UseCase services
 */
let antlrUsecaseServices: AntlrUsecaseServices | undefined;

/**
 * Get or create the singleton ANTLR UseCase services
 */
export function getAntlrUsecaseServices(): AntlrUsecaseServices {
  if (!antlrUsecaseServices) {
    antlrUsecaseServices = createAntlrUsecaseServices();
  }
  return antlrUsecaseServices;
}
