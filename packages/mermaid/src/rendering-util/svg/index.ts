import type { IconLibrary } from '../svgRegister.js';
import database from './default/database.js';
import server from './default/server.js';
import disk from './default/disk.js';
import internet from './default/internet.js';
import cloud from './default/cloud.js';
import unknown from './default/unknown.js';
import blank from './default/blank.js';
import awsCommon from './aws/aws_common.js';
import digitalOcean from './digitial-ocean/digital_ocean.js';
import github from './github/github.js';

const defaultIconLibrary: IconLibrary = {
  database: database,
  server: server,
  disk: disk,
  internet: internet,
  cloud: cloud,
  unknown: unknown,
  blank: blank,
  ...awsCommon,
  ...digitalOcean,
  ...github
};

export default defaultIconLibrary;
