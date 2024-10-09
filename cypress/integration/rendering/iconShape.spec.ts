/* MIT License

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE */
import { imgSnapshotTest } from '../../helpers/util';

const looks = ['classic', 'handDrawn'] as const;
const directions = [
  'TB',
  //'BT',
  'LR',
  //  'RL'
] as const;
const forms = [undefined, 'square', 'circle', 'rounded'] as const;
const labelPos = [undefined, 't', 'b'] as const;

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

describe('Test iconShape with different h', () => {
  it('with different h', () => {
    let flowchartCode = `flowchart TB\n`;
    const icon = 'fa:bell';
    const iconHeight = 64;
    flowchartCode += `  nA --> nAA@{ icon: '${icon}', label: 'icon with different h', h: ${iconHeight} }\n`;
    imgSnapshotTest(flowchartCode);
  });
});

describe('Test colored iconShape', () => {
  it('with no styles', () => {
    let flowchartCode = `flowchart TB\n`;
    const icon = 'fluent-emoji:tropical-fish';
    flowchartCode += `  nA --> nAA@{ icon: '${icon}', form: 'square', label: 'icon with color' }\n`;
    imgSnapshotTest(flowchartCode);
  });

  it('with styles', () => {
    let flowchartCode = `flowchart TB\n`;
    const icon = 'fluent-emoji:tropical-fish';
    flowchartCode += `  nA --> nAA@{ icon: '${icon}', form: 'square', label: 'icon with color' }\n`;
    flowchartCode += `  style nAA fill:#f9f,stroke:#333,stroke-width:4px \n`;
    imgSnapshotTest(flowchartCode);
  });
});
