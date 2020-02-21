/* eslint-env jest */
import { imgSnapshotTest } from '../../helpers/util.js';

describe('Sequencediagram', () => {
  it('should render a gantt chart', () => {
    imgSnapshotTest(
      `
    gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title Adding GANTT diagram to mermaid
      excludes weekdays 2014-01-10

      section A section
      Completed task            :done,    des1, 2014-01-06,2014-01-08
      Active task               :active,  des2, 2014-01-09, 3d
      Future task               :         des3, after des2, 5d
      Future task2               :         des4, after des3, 5d

      section Critical tasks
      Completed task in the critical line :crit, done, 2014-01-06,24h
      Implement parser and jison :crit, done, after des1, 2d
      Create tests for parser             :crit, active, 3d
      Future task in critical line        :crit, 5d
      Create tests for renderer           :2d
      Add to mermaid                      :1d

      section Documentation
      Describe gantt syntax               :active, a1, after des1, 3d
      Add gantt diagram to demo page      :after a1  , 20h
      Add another diagram to demo page    :doc1, after a1  , 48h

      section Last section
      Describe gantt syntax               :after doc1, 3d
      Add gantt diagram to demo page      : 20h
      Add another diagram to demo page    : 48h
      `,
      {}
    );
  });
  it('Handle multiline section titles with different line breaks', () => {
    imgSnapshotTest(
      `
      gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title       GANTT diagram with multiline section titles
      excludes    weekdays 2014-01-10

      section A section<br>multiline
      Completed task            : done,    des1, 2014-01-06,2014-01-08
      Active task               : active,  des2, 2014-01-09, 3d
      Future task               :          des3, after des2, 5d
      Future task2              :          des4, after des3, 5d

      section Critical tasks<br/>multiline
      Completed task in the critical line : crit, done, 2014-01-06, 24h
      Implement parser and jison          : crit, done, after des1, 2d
      Create tests for parser             : crit, active, 3d
      Future task in critical line        : crit, 5d
      Create tests for renderer           : 2d
      Add to mermaid                      : 1d

      section Documentation<br />multiline
      Describe gantt syntax               : active, a1, after des1, 3d
      Add gantt diagram to demo page      : after a1, 20h
      Add another diagram to demo page    : doc1, after a1, 48h

      section Last section<br	/>multiline
      Describe gantt syntax               : after doc1, 3d
      Add gantt diagram to demo page      : 20h
      Add another diagram to demo page    : 48h
      `,
      {}
    );
  });
  it('Multiple dependencies syntax', () => {
    imgSnapshotTest(
      `
      gantt
      dateFormat  YYYY-MM-DD
      axisFormat  %d/%m
      title Adding GANTT diagram to mermaid
      excludes weekdays 2014-01-10

      apple :a, 2017-07-20, 1w
      banana :crit, b, 2017-07-23, 1d
      cherry :active, c, after b a, 1d
      `,
      {}
    );
  });
  it('should render a gantt chart for issue #1060', () => {
    imgSnapshotTest(
      `
      gantt
      excludes weekdays 2017-01-10
      title Projects Timeline

      section asdf
          specs :done, :ps, 2019-05-10, 50d
          Plasma      :pc, 2019-06-20, 60d
          Rollup  :or, 2019-08-20, 50d

      section CEL

          plasma-chamber      :done, :pc, 2019-05-20, 60d
          Plasma Implementation (Rust)      :por, 2019-06-20, 120d
          Predicates (Atomic Swap)      :pred, 2019-07-20, 60d

      section DEX

          History zkSNARK  :hs, 2019-08-10, 40d
          Exit           :vs, after hs, 60d
          PredicateSpec          :ps, 2019-09-1, 20d
          PlasmaIntegration     :pi, after ps,40d


      section Events

      ETHBoston :done, :eb, 2019-09-08, 3d
      DevCon :active, :dc, 2019-10-08, 3d

      section Plasma Calls & updates
          OVM      :ovm, 2019-07-12, 120d
      Plasma call 26 :pc26, 2019-08-21, 1d
      Plasma call 27 :pc27, 2019-09-03, 1d
      Plasma call 28 :pc28, 2019-09-17, 1d
        `,
      {}
    );
  });
});
