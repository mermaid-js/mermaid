import type { DiagramDefinition } from '../../diagram-api/types.js';
import { UseCaseDB } from './useCaseDb.js';
import styles from './styles.js';
import renderer from './useCaseRenderer.js';

// Shared database instance
let db: UseCaseDB;

// Create a simple parser that integrates with our custom parser
const parser = {
  parse: (text: string) => {
    // Use the shared database instance
    db.parse(text);
  },
};

export const diagram: DiagramDefinition = {
  parser,
  get db() {
    if (!db) {
      db = new UseCaseDB();
    }
    return db;
  },
  renderer,
  styles,
  init: (cnf) => {
    // Initialize configuration if needed
    if (!db) {
      db = new UseCaseDB();
    }
  },
};
