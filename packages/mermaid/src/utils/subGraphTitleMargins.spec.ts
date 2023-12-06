import { getSubGraphTitleMargins } from './subGraphTitleMargins.js';
import * as configApi from '../config.js';

describe('getSubGraphTitleMargins', () => {
  it('should get subgraph title margins after config has been set', () => {
    const config_0 = {
      flowchart: {
        subGraphTitleMargin: {
          top: 10,
          bottom: 5,
        },
      },
    };

    configApi.setSiteConfig(config_0);
    expect(getSubGraphTitleMargins(config_0)).toEqual({
      subGraphTitleTopMargin: 10,
      subGraphTitleBottomMargin: 5,
      subGraphTitleTotalMargin: 15,
    });
  });
});
