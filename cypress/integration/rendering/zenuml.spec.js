import { imgSnapshotTest } from '../../helpers/util.js';

describe('Zen UML', () => {
  it('Basic Zen UML diagram', () => {
    imgSnapshotTest(
      `
    zenuml
			A.method() {
        if(x) {
          B.method() {
            selfCall() { return X }
          }
        }
      }
    `,
      {}
    );
  });
});
