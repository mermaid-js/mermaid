import { imgSnapshotTest } from '../../helpers/util';

describe('architecture rendering - group sizing', () => {
  it('group boxes expand to include long names', () => {
    imgSnapshotTest(
      `
      architecture-beta
        group api(cloud)[Public API with a very very long group name that should expand the group box]

        service srv1(server)[Server 1] in api
        service srv2(database)[Database] in api

        srv1:R -- L:srv2
      `,
      { logLevel: 0 }
    );
  });
});
