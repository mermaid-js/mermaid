import { imgSnapshotTest } from './util';

const looks = ['classic', 'handDrawn'] as const;
const directions = [
  'TB',
  //'BT',
  'LR',
  //  'RL'
] as const;
const labelPos = [undefined, 't', 'b'] as const;

export type IconShapeForm = undefined | 'square' | 'circle' | 'rounded';

/**
 * Registers the full iconShape test matrix (looks × directions × labelPos, with
 * the seven label/style cases) for the given `forms`.
 *
 * The matrix is large (~84 tests per form), so it is split across one spec file
 * per form (iconShape*.spec.ts) to keep any single spec well under the heaviest
 * other specs — this lets cypress-split balance it across shards and keeps the
 * per-spec coverage payload small. Titles are produced exactly as before so the
 * rendered screenshots are unchanged.
 */
export function registerIconShapeTests(forms: readonly IconShapeForm[]): void {
  looks.forEach((look) => {
    directions.forEach((direction) => {
      forms.forEach((form) => {
        labelPos.forEach((pos) => {
          describe(`Test iconShape in ${form ? `${form} form,` : ''} ${look} look and dir ${direction} with label position ${pos ? pos : 'not defined'}`, () => {
            it(`without label`, () => {
              let flowchartCode = `flowchart ${direction}\n`;
              flowchartCode += `  nA --> nAA@{ icon: 'fa:bell'`;
              if (form) {
                flowchartCode += `, form: '${form}'`;
              }
              flowchartCode += ` }\n`;
              imgSnapshotTest(flowchartCode, { look });
            });

            it(`with label`, () => {
              let flowchartCode = `flowchart ${direction}\n`;
              flowchartCode += `  nA --> nAA@{ icon: 'fa:bell', label: 'This is a label for icon shape'`;
              if (form) {
                flowchartCode += `, form: '${form}'`;
              }
              if (pos) {
                flowchartCode += `, pos: '${pos}'`;
              }
              flowchartCode += ` }\n`;
              imgSnapshotTest(flowchartCode, { look });
            });

            it(`with very long label`, () => {
              let flowchartCode = `flowchart ${direction}\n`;
              flowchartCode += `  nA --> nAA@{ icon: 'fa:bell', label: 'This is a very very very very very long long long label for icon shape'`;
              if (form) {
                flowchartCode += `, form: '${form}'`;
              }
              if (pos) {
                flowchartCode += `, pos: '${pos}'`;
              }
              flowchartCode += ` }\n`;
              imgSnapshotTest(flowchartCode, { look });
            });

            it(`with markdown htmlLabels:true`, () => {
              let flowchartCode = `flowchart ${direction}\n`;
              flowchartCode += `  nA --> nAA@{ icon: 'fa:bell', label: 'This is **bold** </br>and <strong>strong</strong> for icon shape'`;
              if (form) {
                flowchartCode += `, form: '${form}'`;
              }
              if (pos) {
                flowchartCode += `, pos: '${pos}'`;
              }
              flowchartCode += ` }\n`;
              imgSnapshotTest(flowchartCode, { look });
            });

            it(`with markdown htmlLabels:false`, () => {
              let flowchartCode = `flowchart ${direction}\n`;
              flowchartCode += `  nA --> nAA@{ icon: 'fa:bell', label: 'This is **bold** </br>and <strong>strong</strong> for icon shape'`;
              if (form) {
                flowchartCode += `, form: '${form}'`;
              }
              if (pos) {
                flowchartCode += `, pos: '${pos}'`;
              }
              flowchartCode += ` }\n`;
              imgSnapshotTest(flowchartCode, {
                look,
                htmlLabels: false,
                flowchart: { htmlLabels: false },
              });
            });

            it(`with styles`, () => {
              let flowchartCode = `flowchart ${direction}\n`;
              flowchartCode += `  nA --> nAA@{ icon: 'fa:bell', label: 'new icon shape'`;
              if (form) {
                flowchartCode += `, form: '${form}'`;
              }
              if (pos) {
                flowchartCode += `, pos: '${pos}'`;
              }
              flowchartCode += ` }\n`;
              flowchartCode += `  style nAA fill:#f9f,stroke:#333,stroke-width:4px \n`;
              imgSnapshotTest(flowchartCode, { look });
            });

            it(`with classDef`, () => {
              let flowchartCode = `flowchart ${direction}\n`;
              flowchartCode += `  classDef customClazz fill:#bbf,stroke:#f66,stroke-width:2px,color:#fff,stroke-dasharray: 5 5\n`;
              flowchartCode += `  nA --> nAA@{ icon: 'fa:bell', label: 'new icon shape'`;
              if (form) {
                flowchartCode += `, form: '${form}'`;
              }
              if (pos) {
                flowchartCode += `, pos: '${pos}'`;
              }
              flowchartCode += ` }\n`;
              flowchartCode += `  nAA:::customClazz\n`;
              imgSnapshotTest(flowchartCode, { look });
            });
          });
        });
      });
    });
  });
}
