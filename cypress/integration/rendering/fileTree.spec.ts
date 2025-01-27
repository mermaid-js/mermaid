import { imgSnapshotTest } from '../../helpers/util';

describe('FileTree Diagram', () => {
  it('should render a simple fileTree diagram', () => {
    imgSnapshotTest(
      `fileTree-beta
            file1.ts`
    );
  });

  it('should render a complex fileTree diagram', () => {
    imgSnapshotTest(
      `fileTree-beta
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

  it('should render a complex fileTree diagram with multiple roots', () => {
    imgSnapshotTest(
      `fileTree-beta
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
