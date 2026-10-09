import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { EmFrame, EmResetFrame, EmTimeFrame, MermaidAstType } from '../generated/ast.js';
import type { EventModelingServices } from './module.js';

const COMMAND_TYPES = new Set<string>(['cmd', 'command']);
const EVENT_TYPES = new Set<string>(['evt', 'event']);
const READMODEL_TYPES = new Set<string>(['rmo', 'readmodel']);
const PROCESSOR_TYPES = new Set<string>(['pcr', 'processor']);
const UI_TYPES = new Set<string>(['ui']);

export function registerValidationChecks(services: EventModelingServices) {
  const validator = services.validation.EventModelingValidator;
  const registry = services.validation.ValidationRegistry;
  if (registry) {
    const checks: ValidationChecks<MermaidAstType> = {
      EmTimeFrame: validator.checkSourceFrameTypes.bind(validator),
      EmResetFrame: validator.checkSourceFrameTypes.bind(validator),
    };
    registry.register(checks, validator);
  }
}

export class EventModelingValidator {
  checkSourceFrameTypes(frame: EmTimeFrame | EmResetFrame, accept: ValidationAcceptor): void {
    if (frame.sourceFrames.length === 0) {
      return;
    }

    if (COMMAND_TYPES.has(frame.modelEntityType)) {
      this.validateSources(
        frame,
        new Set([...UI_TYPES, ...PROCESSOR_TYPES]),
        'command',
        'ui or processor',
        accept
      );
    } else if (EVENT_TYPES.has(frame.modelEntityType)) {
      this.validateSources(frame, COMMAND_TYPES, 'event', 'command', accept);
    } else if (READMODEL_TYPES.has(frame.modelEntityType)) {
      this.validateSources(frame, EVENT_TYPES, 'read model', 'event', accept);
    } else if (PROCESSOR_TYPES.has(frame.modelEntityType)) {
      this.validateSources(frame, READMODEL_TYPES, 'processor', 'read model', accept);
    } else if (UI_TYPES.has(frame.modelEntityType)) {
      this.validateSources(frame, READMODEL_TYPES, 'ui', 'read model', accept);
    }
  }

  private validateSources(
    frame: EmTimeFrame | EmResetFrame,
    allowedSourceTypes: Set<string>,
    targetLabel: string,
    expectedSourceLabel: string,
    accept: ValidationAcceptor
  ): void {
    for (const sourceRef of frame.sourceFrames) {
      const source: EmFrame | undefined = sourceRef.ref;
      if (source !== undefined && !allowedSourceTypes.has(source.modelEntityType)) {
        accept(
          'error',
          `A ${targetLabel} can only receive input from a ${expectedSourceLabel}, not from '${source.modelEntityType}'.`,
          { node: frame, property: 'sourceFrames' }
        );
      }
    }
  }
}
