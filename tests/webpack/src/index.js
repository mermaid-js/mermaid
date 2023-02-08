/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const mermaid = require('mermaid');
import mindmap from '@mermaid-js/mermaid-mindmap';

const render = async (graph) => {
  const svg = await mermaid.renderAsync('dummy', graph);
  console.log(svg);
  document.getElementById('graphDiv').innerHTML = svg;
};

const load = async () => {
  await mermaid.registerExternalDiagrams([mindmap]);
  await render('info');

  setTimeout(() => {
    void render(`mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectivness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid
			`);
  }, 2500);
};

window.addEventListener('load', () => void load(), false);
