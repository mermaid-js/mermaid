import { imgSnapshotTest } from '../../helpers/util';

describe('TreeView Diagram', () => {
  it('should render a simple treeView diagram', () => {
    imgSnapshotTest(
      `treeView-beta
            file1.ts`
    );
  });

  it('should render a complex treeView diagram', () => {
    imgSnapshotTest(
      `treeView-beta
            root
                folder1
                    file1.js
                    file2.ts
                folder2
                    file3.spec.ts
                    folder3
                        file4.ts
                        file5.ts
                        folder4
                            file6.ts
                file7.ts`
    );
  });

  it('should render a complex treeView diagram with multiple roots', () => {
    imgSnapshotTest(
      `treeView-beta
            folder1
                file1.js
                file2.ts
            folder2
                file3.spec.ts
                folder3
                    file4.ts
                    file5.ts
                    folder4
                        file6.ts
            file7.ts`
    );
  });
});
