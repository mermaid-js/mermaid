import { log } from '../logger.js';
import { detectors } from './detectType.js';
import { getDiagram, registerDiagram } from './diagramAPI.js';

export const loadRegisteredDiagrams = async () => {
  log.debug(`Loading registered diagrams`);
  // Load all lazy loaded diagrams in parallel
  const results = await Promise.allSettled(
    Object.entries(detectors).map(async ([key, { detector, loader }]) => {
      if (loader) {
        try {
          getDiagram(key);
        } catch {
          try {
            // Register diagram if it is not already registered
            const { diagram, id } = await loader();
            registerDiagram(id, diagram, detector);
          } catch (err) {
            // Remove failed diagram from detectors
            log.error(`Failed to load external diagram with key ${key}. Removing from detectors.`);
            delete detectors[key];
            throw err;
          }
        }
      }
    })
  );
  const failed = results.filter((result) => result.status === 'rejected');
  if (failed.length > 0) {
    log.error(`Failed to load ${failed.length} external diagrams`);
    for (const res of failed) {
      log.error(res);
    }
    throw new Error(`Failed to load ${failed.length} external diagrams`);
  }
};
