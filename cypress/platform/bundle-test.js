import mermaid from '../../dist/mermaid.core';

let code = `flowchart LR
Power_Supply --> Transmitter_A
Power_Supply --> Transmitter_B
Transmitter_A --> D
Transmitter_B --> D`;

let code2 = `gantt
  dateFormat  YYYY-MM-DD
  title Adding GANTT diagram functionality to mermaid
  section A section
  Completed task      :done,    des1, 2014-01-06,2014-01-08
  Active task         :active,  des2, 2014-01-09, 3d
  Future task         :   des3, after des2, 5d
  Future task2         :   des4, after des3, 5d
  section Critical tasks
  Completed task in the critical line :crit, done, 2014-01-06,24h
  Implement parser and jison    :crit, done, after des1, 2d
  Create tests for parser       :crit, active, 3d
  Future task in critical line  :crit, 5d
  Create tests for renderer     :2d
  Add to mermaid                :1d`;

const code3 = `flowchart TD
A(<img scr='https://iconscout.com/ms-icon-310x310.png' width='20' height='20' />)
B(<b>Bold text!</b>)`;

if (location.href.match('test-html-escaping')) {
  code = code3;
}


mermaid.initialize({
  theme: 'default',
  // fontFamily: '"Lucida Console", Monaco, monospace',
  startOnLoad: false,
  securityLevel: 'loose',
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
