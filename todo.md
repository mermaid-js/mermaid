- Get familar with jison
- git graph requires a blank line at the end. why?
- Create a desktop client
- Replace all `lineInterpolate` with `curve`

I have the feeling that the flowchart DSL is not very readable or expressive despite it is short.
And it is too limited for complicated requirements such as: https://github.com/knsv/mermaid/issues/592

Maybe the following is better:

```json
{
  "nodes": [
    {
      "name": "A"
    }
    {
      "name": "B"
    }
  ],
  "edges": [
    {
      "from": "A",
      "to": "B",
      "style": "dashed"
    }
  ]
}
```
