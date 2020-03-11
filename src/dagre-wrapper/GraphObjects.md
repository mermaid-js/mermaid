# Graph objects and their properties

Explains the representation of various objects used to render the flow charts and what the properties mean. This ofc from the perspective of the dagre-wrapper.

## node

Sample object:
```json
{
  "labelType":"svg",
  "labelStyle":"",
  "shape":"rect",
  "label":{},
  "labelText":"Test",
  "rx":0,"ry":0,
  "class":"default",
  "style":"",
  "id":"Test",
  "type":"group",
  "padding":15}
```

This is set by the renderer of the diagram and insert the data that the wrapper neds for rendering.

|  property  |                                                 description                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| labelType  | If the label should be html label or a svg label. Should we continue to support both?                       |
| labelStyle | Css styles for the label. Not currently used.                                                               |
| shape      | The shape of the node. Currently on rect is suppoerted. This will change.                                   |
| label      | ??                                                                                                          |
| labelText  | The text on the label                                                                                       |
| rx         | The corner radius - maybe part of the shape instead?                                                        |
| ry         | The corner radius - maybe part of the shape instead?                                                        |
| class      | Class to be set for the shape                                                                               |
| style      | Css styles for the actual shape                                                                             |
| id         | id of the shape                                                                                             |
| type       | if set to group then this node indicates a cluster.                                                         |
| padding    | Padding. Passed from the renderr as this might differ between react for different diagrams. Maybe obsolete. |
