import { describe, it } from 'vitest';
import { buildShapeDoc } from './shapesDoc.js';

describe('build shapesTable', () => {
  it('should build shapesTable based on the shapeDefs', () => {
    expect(buildShapeDoc()).toMatchInlineSnapshot(`
      "| **Semantic Name**                 | **Shape Name**         | **Short Name** | **Description**                | **Alias Supported**                                              |
      | --------------------------------- | ---------------------- | -------------- | ------------------------------ | ---------------------------------------------------------------- |
      | Card                              | Notched Rectangle      | \`notch-rect\`   | Represents a card              | \`card\`, \`notched-rectangle\`                                      |
      | Collate                           | Hourglass              | \`hourglass\`    | Represents a collate operation | \`collate\`, \`hourglass\`                                           |
      | Com Link                          | Lightning Bolt         | \`bolt\`         | Communication link             | \`com-link\`, \`lightning-bolt\`                                     |
      | Comment                           | Curly Brace            | \`brace\`        | Adds a comment                 | \`brace-l\`, \`comment\`                                             |
      | Comment Right                     | Curly Brace            | \`brace-r\`      | Adds a comment                 |                                                                  |
      | Comment with braces on both sides | Curly Braces           | \`braces\`       | Adds a comment                 |                                                                  |
      | Data Input/Output                 | Lean Right             | \`lean-r\`       | Represents input or output     | \`in-out\`, \`lean-right\`                                           |
      | Data Input/Output                 | Lean Left              | \`lean-l\`       | Represents output or input     | \`lean-left\`, \`out-in\`                                            |
      | Database                          | Cylinder               | \`cyl\`          | Database storage               | \`cylinder\`, \`database\`, \`db\`                                     |
      | Decision                          | Diamond                | \`diam\`         | Decision-making step           | \`decision\`, \`diamond\`, \`question\`                                |
      | Delay                             | Half-Rounded Rectangle | \`delay\`        | Represents a delay             | \`half-rounded-rectangle\`                                         |
      | Direct Access Storage             | Horizontal Cylinder    | \`h-cyl\`        | Direct access storage          | \`das\`, \`horizontal-cylinder\`                                     |
      | Disk Storage                      | Lined Cylinder         | \`lin-cyl\`      | Disk storage                   | \`disk\`, \`lined-cylinder\`                                         |
      | Display                           | Curved Trapezoid       | \`curv-trap\`    | Represents a display           | \`curved-trapezoid\`, \`display\`                                    |
      | Divided Process                   | Divided Rectangle      | \`div-rect\`     | Divided process shape          | \`div-proc\`, \`divided-process\`, \`divided-rectangle\`               |
      | Document                          | Document               | \`doc\`          | Represents a document          | \`doc\`, \`document\`                                                |
      | Event                             | Rounded Rectangle      | \`rounded\`      | Represents an event            | \`event\`                                                          |
      | Extract                           | Triangle               | \`tri\`          | Extraction process             | \`extract\`, \`triangle\`                                            |
      | Fork/Join                         | Filled Rectangle       | \`fork\`         | Fork or join in process flow   | \`join\`                                                           |
      | Internal Storage                  | Window Pane            | \`win-pane\`     | Internal storage               | \`internal-storage\`, \`window-pane\`                                |
      | Junction                          | Filled Circle          | \`f-circ\`       | Junction point                 | \`filled-circle\`, \`junction\`                                      |
      | Lined Document                    | Lined Document         | \`lin-doc\`      | Lined document                 | \`lined-document\`                                                 |
      | Lined/Shaded Process              | Lined Rectangle        | \`lin-rect\`     | Lined process shape            | \`lin-proc\`, \`lined-process\`, \`lined-rectangle\`, \`shaded-process\` |
      | Loop Limit                        | Trapezoidal Pentagon   | \`notch-pent\`   | Loop limit step                | \`loop-limit\`, \`notched-pentagon\`                                 |
      | Manual File                       | Flipped Triangle       | \`flip-tri\`     | Manual file operation          | \`flipped-triangle\`, \`manual-file\`                                |
      | Manual Input                      | Sloped Rectangle       | \`sl-rect\`      | Manual input step              | \`manual-input\`, \`sloped-rectangle\`                               |
      | Manual Operation                  | Trapezoid Base Top     | \`trap-t\`       | Represents a manual task       | \`inv-trapezoid\`, \`manual\`, \`trapezoid-top\`                       |
      | Multi-Document                    | Stacked Document       | \`docs\`         | Multiple documents             | \`documents\`, \`st-doc\`, \`stacked-document\`                        |
      | Multi-Process                     | Stacked Rectangle      | \`st-rect\`      | Multiple processes             | \`processes\`, \`procs\`, \`stacked-rectangle\`                        |
      | Odd                               | Odd                    | \`odd\`          | Odd shape                      |                                                                  |
      | Paper Tape                        | Flag                   | \`flag\`         | Paper tape                     | \`paper-tape\`                                                     |
      | Prepare Conditional               | Hexagon                | \`hex\`          | Preparation or condition step  | \`hexagon\`, \`prepare\`                                             |
      | Priority Action                   | Trapezoid Base Bottom  | \`trap-b\`       | Priority action                | \`priority\`, \`trapezoid\`, \`trapezoid-bottom\`                      |
      | Process                           | Rectangle              | \`rect\`         | Standard process shape         | \`proc\`, \`process\`, \`rectangle\`                                   |
      | Start                             | Circle                 | \`circle\`       | Starting point                 | \`circ\`                                                           |
      | Start                             | Small Circle           | \`sm-circ\`      | Small starting point           | \`small-circle\`, \`start\`                                          |
      | Stop                              | Double Circle          | \`dbl-circ\`     | Represents a stop point        | \`double-circle\`                                                  |
      | Stop                              | Framed Circle          | \`fr-circ\`      | Stop point                     | \`framed-circle\`, \`stop\`                                          |
      | Stored Data                       | Bow Tie Rectangle      | \`bow-rect\`     | Stored data                    | \`bow-tie-rectangle\`, \`stored-data\`                               |
      | Subprocess                        | Framed Rectangle       | \`fr-rect\`      | Subprocess                     | \`framed-rectangle\`, \`subproc\`, \`subprocess\`, \`subroutine\`        |
      | Summary                           | Crossed Circle         | \`cross-circ\`   | Summary                        | \`crossed-circle\`, \`summary\`                                      |
      | Tagged Document                   | Tagged Document        | \`tag-doc\`      | Tagged document                | \`tag-doc\`, \`tagged-document\`                                     |
      | Tagged Process                    | Tagged Rectangle       | \`tag-rect\`     | Tagged process                 | \`tag-proc\`, \`tagged-process\`, \`tagged-rectangle\`                 |
      | Terminal Point                    | Stadium                | \`stadium\`      | Terminal point                 | \`pill\`, \`terminal\`                                               |
      | Text Block                        | Text Block             | \`text\`         | Text block                     |                                                                  |"
    `);
  });
});
