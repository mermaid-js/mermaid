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


# edge

arrowType sets the type of arrows to use. The following arrow types are currently supported:

arrow_cross
double_arrow_cross
arrow_point
double_arrow_point
arrow_circle
double_arrow_circle

Lets try to make these types semantic free so that diagram type semantics does not find its way in to this more generic layer.


# Markers

Define what markers that should be included in the diagram with the insert markers function. The function takes two arguments, first the element in which the markers should be included and a list of the markers that should be added.

Ex:
insertMarkers(el, ['point', 'circle'])

The example above adds the markers point and cross. This means that edges with the arrowTypes arrow_cross, double_arrow_cross, arrow_point and double_arrow_cross will get the corresponding markers but arrowType arrow_cross will have no impact.

Current markers:
* point - the standard arrow from flowcharts
* circle - Arrows ending with circle
* cross - arrows starting and ending with a cross