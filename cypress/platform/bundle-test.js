import mermaid from '../../dist/mermaid.core';

const code = `graph LR
Power_Supply --> Transmitter_A
Power_Supply --> Transmitter_B
Transmitter_A --> D
Transmitter_B --> D`;

mermaid.initialize({
  theme: 'forest',
  fontFamily: '"Lucida Console", Monaco, monospace',
  startOnLoad: false,
  flowchart: {
    htmlLabels: true
  },
  gantt: {
    axisFormatter: [
      [
        '%Y-%m-%d',
        d => {
          return d.getDay() === 1;
        }
      ]
    ]
  }
});
mermaid.render(
  'the-id-of-the-svg',
  code,
  svg => {
    console.log(svg);
    const elem = document.querySelector('#graph-to-be');
    elem.innerHTML = svg;
  }
  // ,document.querySelector('#tmp')
);
