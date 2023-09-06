import { CommonTokenBuilder } from '../common/index.js';

export class InfoTokenBuilder extends CommonTokenBuilder {
  public constructor() {
    super(['info', 'showInfo']);
  }
}
