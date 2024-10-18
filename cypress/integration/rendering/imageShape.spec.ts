import { imgSnapshotTest } from '../../helpers/util';

const looks = ['classic', 'handDrawn'] as const;
const directions = [
  'TB',
  //'BT',
  'LR',
  //  'RL'
] as const;
const labelPos = [undefined, 't', 'b'] as const;

looks.forEach((look) => {
  directions.forEach((direction) => {
    labelPos.forEach((pos) => {
      describe(`Test imageShape in ${look} look and dir ${direction} with label position ${pos ? pos : 'not defined'}`, () => {
        it(`without label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          flowchartCode += `  nA --> A@{ img: 'https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg', w: '100', h: '100' }\n`;
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          flowchartCode += `  nA --> A@{ img: 'https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg', label: 'This is a label for image shape'`;

          flowchartCode += `, w: '100', h: '200'`;
          if (pos) {
            flowchartCode += `, pos: '${pos}'`;
          }
          flowchartCode += ` }\n`;
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with very long label`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          flowchartCode += `  nA --> A@{ img: 'https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg', label: 'This is a very very very very very long long long label for image shape'`;

          flowchartCode += `, w: '100', h: '250'`;
          if (pos) {
            flowchartCode += `, pos: '${pos}'`;
          }
          flowchartCode += ` }\n`;
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with markdown htmlLabels:true`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          flowchartCode += `  nA --> A@{ img: 'https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg', label: 'This is **bold** </br>and <strong>strong</strong> for image shape'`;

          flowchartCode += `, w: '550', h: '200'`;
          if (pos) {
            flowchartCode += `, pos: '${pos}'`;
          }
          flowchartCode += ` }\n`;
          imgSnapshotTest(flowchartCode, { look, htmlLabels: true });
        });

        it(`with markdown htmlLabels:false`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          flowchartCode += `  nA --> A@{ img: 'https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg', label: 'This is **bold** </br>and <strong>strong</strong> for image shape'`;
          flowchartCode += `, w: '250', h: '200'`;

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
          flowchartCode += `  nA --> A@{ img: 'https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg', label: 'new image shape'`;
          flowchartCode += `, w: '550', h: '200'`;

          if (pos) {
            flowchartCode += `, pos: '${pos}'`;
          }
          flowchartCode += ` }\n`;
          flowchartCode += `  style A fill:#f9f,stroke:#333,stroke-width:4px \n`;
          imgSnapshotTest(flowchartCode, { look });
        });

        it(`with classDef`, () => {
          let flowchartCode = `flowchart ${direction}\n`;
          flowchartCode += `  classDef customClazz fill:#bbf,stroke:#f66,stroke-width:2px,color:#000000,stroke-dasharray: 5 5\n`;
          flowchartCode += `  nA --> A@{ img: 'https://cdn.pixabay.com/photo/2020/02/22/18/49/paper-4871356_1280.jpg', label: 'new image shape'`;

          flowchartCode += `, w: '500', h: '550'`;
          if (pos) {
            flowchartCode += `, pos: '${pos}'`;
          }
          flowchartCode += ` }\n`;
          flowchartCode += `  A:::customClazz\n`;
          imgSnapshotTest(flowchartCode, { look });
        });
      });
    });
  });
});
