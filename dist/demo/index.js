const api = require('../../src/mermaidAPI.js')
console.log(api)

const r = api.parse(`sequenceDiagram
loop every day
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
end`)

console.log(r)
