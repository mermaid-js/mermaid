import mermaid from '../../dist/mermaid.core'

mermaid.initialize({
  theme: 'forest',
  gantt: { axisFormatter: [
    ['%Y-%m-%d', (d) => {
      return d.getDay() === 1
    }]
  ] }
})
