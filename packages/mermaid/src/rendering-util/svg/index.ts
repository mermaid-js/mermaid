import type { IconLibrary } from '../svgRegister.js';
import database from './default/database.js';
import server from './default/server.js';
import disk from './default/disk.js';
import internet from './default/internet.js';
import cloud from './default/cloud.js';
import unknown from './default/unknown.js';
import blank from './default/blank.js';

/** Creates a resolver to the path to lazy-load included icon packs */
const getIconNamespaces = (basePath: string) => ({
  'aws:common': `${basePath}/aws/awsCommon.js`,
  'aws:full': `${basePath}/aws/awsFull.js`,
  github: `${basePath}/github/github.js`,
  'digital-ocean': `${basePath}/digital-ocean/digitalOcean.js`,
});

type IconNamespaceKeys = keyof ReturnType<typeof getIconNamespaces>;

const defaultIconLibrary: IconLibrary = {
  database: database,
  server: server,
  disk: disk,
  internet: internet,
  cloud: cloud,
  unknown: unknown,
  blank: blank,
};

export default defaultIconLibrary;
export { getIconNamespaces };
export type { IconNamespaceKeys };
