import type { DiagramDefinition } from '../../diagram-api/types.js';
import { renderer } from './errorRenderer.js';

let errorMessage: string | undefined;

const db = {
  clear() {
    errorMessage = undefined;
  },
  setErrorMessage(message: string) {
    errorMessage = message;
  },
  getErrorMessage(): string | undefined {
    return errorMessage;
  },
};

const diagram: DiagramDefinition = {
  db,
  renderer,
  parser: {
    parse: (): void => {
      return;
    },
  },
};

export default diagram;
