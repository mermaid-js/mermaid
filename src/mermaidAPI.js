/**
 * This is the api to be used when optionally handling the integration with the web page, instead of using the default integration provided by mermaid.js.
 *
 * The core of this api is the [**render**](https://github.com/knsv/mermaid/blob/master/docs/mermaidAPI.md#render) function which, given a graph
 * definition as text, renders the graph/diagram and returns an svg element for the graph.
 *
 * It is is then up to the user of the API to make use of the svg, either insert it somewhere in the page or do something completely different.
 *
 * In addition to the render function, a number of behavioral configuration options are available.
 *
 * @name mermaidAPI
 */
import { select } from 'd3';
import scope from 'scope-css';
import pkg from '../package.json';
import { setConfig, getConfig } from './config';
import { logger, setLogLevel } from './logger';
import utils from './utils';
import flowRenderer from './diagrams/flowchart/flowRenderer';
import flowRendererV2 from './diagrams/flowchart/flowRenderer-v2';
import flowParser from './diagrams/flowchart/parser/flow';
import flowDb from './diagrams/flowchart/flowDb';
import sequenceRenderer from './diagrams/sequence/sequenceRenderer';
import sequenceParser from './diagrams/sequence/parser/sequenceDiagram';
import sequenceDb from './diagrams/sequence/sequenceDb';
import ganttRenderer from './diagrams/gantt/ganttRenderer';
import ganttParser from './diagrams/gantt/parser/gantt';
import ganttDb from './diagrams/gantt/ganttDb';
import classRenderer from './diagrams/class/classRenderer';
import classParser from './diagrams/class/parser/classDiagram';
import classDb from './diagrams/class/classDb';
import stateRenderer from './diagrams/state/stateRenderer';
import stateRendererV2 from './diagrams/state/stateRenderer-v2';
import stateParser from './diagrams/state/parser/stateDiagram';
import stateDb from './diagrams/state/stateDb';
import gitGraphRenderer from './diagrams/git/gitGraphRenderer';
import gitGraphParser from './diagrams/git/parser/gitGraph';
import gitGraphAst from './diagrams/git/gitGraphAst';
import infoRenderer from './diagrams/info/infoRenderer';
import errorRenderer from './errorRenderer';
import infoParser from './diagrams/info/parser/info';
import infoDb from './diagrams/info/infoDb';
import pieRenderer from './diagrams/pie/pieRenderer';
import pieParser from './diagrams/pie/parser/pie';
import pieDb from './diagrams/pie/pieDb';
import erDb from './diagrams/er/erDb';
import erParser from './diagrams/er/parser/erDiagram';
import erRenderer from './diagrams/er/erRenderer';
import journeyParser from './diagrams/user-journey/parser/journey';
import journeyDb from './diagrams/user-journey/journeyDb';
import journeyRenderer from './diagrams/user-journey/journeyRenderer';

const themes = {};

for (const themeName of ['default', 'forest', 'dark', 'neutral']) {
  themes[themeName] = require(`./themes/${themeName}/index.scss`);
}

/**
 * These are the default options which can be overridden with the initialization call like so:
 * **Example 1:**
 * <pre>
 * mermaid.initialize({
 *   flowchart:{
 *     htmlLabels: false
 *   }
 * });
 * </pre>
 *
 * **Example 2:**
 * <pre>
 * &lt;script>
 *   var config = {
 *     startOnLoad:true,
 *     flowchart:{
 *       useMaxWidth:true,
 *       htmlLabels:true,
 *       curve:'cardinal',
 *     },
 *
 *     securityLevel:'loose',
 *   };
 *   mermaid.initialize(config);
 * &lt;/script>
 * </pre>
 * A summary of all options and their defaults is found [here](https://github.com/knsv/mermaid/blob/master/docs/mermaidAPI.md#mermaidapi-configuration-defaults). A description of each option follows below.
 *
 * @name Configuration
 */
const config = {
  /** theme , the CSS style sheet
   *
   * theme , the CSS style sheet
   *| Parameter | Description |Type | Required | Values|
   *| --- | --- | --- | --- | --- |
   *| Theme |Built in Themes| String | Optional | Values include, default, forest, dark, neutral, null|
   ***Notes:**To disable any pre-defined mermaid theme, use "null".
   * <pre>
   *  "theme": "forest",
   *  "themeCSS": ".node rect { fill: red; }"
   * </pre>
   */
  theme: 'default',
  themeCSS: undefined,
  /* **maxTextSize** - The maximum allowed size of the users text diamgram */
  maxTextSize: 50000,

  /**
   *| Parameter | Description |Type | Required | Values|
   *| --- | --- | --- | --- | --- |
   *|fontFamily | specifies the font to be used in the rendered diagrams| String | Required | Verdana, Arial, Trebuchet MS,|
   *
   ***notes: Default value is \\"trebuchet ms\\".
   */
  fontFamily: '"trebuchet ms", verdana, arial;',

  /**
   *| Parameter | Description |Type | Required | Values|
   *| --- | --- | --- | --- | --- |
   *| logLevel |This option decides the amount of logging to be used.| String | Required | 1, 2, 3, 4, 5 |
   *
   *
   ***Notes:**
   *-   debug: 1.
   *-   info: 2.
   *-   warn: 3.
   *-   error: 4.
   *-   fatal: 5(default).
   */
  logLevel: 5,

  /**
   *| Parameter | Description |Type | Required | Values|
   *| --- | --- | --- | --- | --- |
   *| securitylevel | Level of trust for parsed diagram|String | Required | Strict, Loose |
   *
   ***Notes:
   *-   **strict**: (**default**) tags in text are encoded, click functionality is disabeled
   *-   **loose**: tags in text are allowed, click functionality is enabled
   */
  securityLevel: 'strict',

  /**
   *| Parameter | Description |Type | Required | Values|
   *| --- | --- | --- | --- | --- |
   *| startOnLoad| Dictates whether mermaind starts on Page load | Boolean | Required | True, False |
   *
   ***Notes:**
   ***Default value: true**
   */
  startOnLoad: true,

  /**
   *| Parameter | Description |Type | Required |Values|
   *| --- | --- | --- | --- | --- |
   *| arrowMarkerAbsolute | Controls whether or arrow markers in html code are absolute paths or anchors | Boolean | Required |  True, False |
   *
   *
   *## Notes**: This matters if you are using base tag settings.
   ***Default value: false**.
   */
  arrowMarkerAbsolute: false,

  /**
   * The object containing configurations specific for flowcharts
   */
  flowchart: {
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| htmlLabels | Flag for setting whether or not a html tag should be used for rendering labels on the edges. | Boolean| Required | True, False|
     *
     ***Notes: Default value: true**.
     */
    htmlLabels: true,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| nodeSpacing | Defines the spacing between nodes on the same level | Integer| Required | Any positive Numbers |
     *
     ***Notes:
     *Pertains to horizontal spacing for TB (top to bottom) or BT (bottom to top) graphs, and the vertical spacing for LR as well as RL graphs.**
     ***Default value 50**.
     */
    nodeSpacing: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| rankSpacing | Defines the spacing between nodes on different levels | Integer | Required| Any Positive Numbers |
     *
     ***Notes: pertains to vertical spacing for TB (top to bottom) or BT (bottom to top), and the horizontal spacing for LR as well as RL graphs.
     ***Default value 50**.
     */
    rankSpacing: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| curve | Defines how mermaid renders curves for flowcharts. | String | Required | Basis, Linear, Cardinal|
     *
     ***Notes:
     *Default Vaue: Linear**
     */
    curve: 'linear',
    // Only used in new experimental rendering
    // repreesents the padding between the labels and the shape
    padding: 15
  },

  /**
   * The object containing configurations specific for sequence diagrams
   */
  sequence: {
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| diagramMarginX | margin to the right and left of the sequence diagram | Integer | Required | Any Positive Values |
     *
     ***Notes:**
     ***Default value 50**.
     */
    diagramMarginX: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| diagramMarginY | Margin to the over and under the sequence diagram | Integer | Required | Any Positive Values|
     *
     ***Notes:**
     ***Default value 10**.
     */
    diagramMarginY: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| actorMargin | Margin between actors. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 50**.
     */
    actorMargin: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| width | Width of actor boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 150**.
     */
    width: 150,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| height | Height of actor boxes | Integer | Required | Any Positive Value|
     *
     ***Notes:**
     ***Default value 65**..
     */
    height: 65,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| boxMargin | Margin around loop boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     *
     ***Default value 10**.
     */
    boxMargin: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| boxTextMargin| margin around the text in loop/alt/opt boxes | Integer | Required| Any Positive Value|
     *
     ***Notes:**
     *
     ***Default value 5**.
     */
    boxTextMargin: 5,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| noteMargin | margin around notes. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     *
     ***Default value 10**.
     */
    noteMargin: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageMargin | Space between messages. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     *
     *Space between messages.
     ***Default value 35**.
     */
    messageMargin: 35,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageAlign | Multiline message alignment | Integer | Required | left, center, right |
     *
     ***Notes:**center **default**
     */
    messageAlign: 'center',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| mirrorActors | mirror actors under diagram. | Boolean| Required | True, False |
     *
     ***Notes:**
     *
     ***Default value true**.
     */
    mirrorActors: true,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| bottomMarginAdj | Prolongs the edge of the diagram downwards. | Integer | Required | Any Positive Value |
     *
     ***Notes:**Depending on css styling this might need adjustment.
     ***Default value 1**.
     */
    bottomMarginAdj: 1,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| useMaxWidth | See Notes | Boolean | Required | True, False |
     *
     ***Notes:**
     *when this flag is set to true, the height and width is set to 100% and is then scaling with the
     *available space. If set to false, the absolute space required is used.
     ***Default value: True**.
     */
    useMaxWidth: true,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| rightAngles | display curve arrows as right angles| Boolean | Required | True, False |
     *
     ***Notes:**
     *
     *This will display arrows that start and begin at the same node as right angles, rather than a curve
     ***Default value false**.
     */
    rightAngles: false,
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| showSequenceNumbers | This will show the node numbers | Boolean | Required | True, False |
     *
     ***Notes:**
     ***Default value false**.
     */
    showSequenceNumbers: false,
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| actorFontSize| This sets the font size of the actor's description | Integer | Require | Any Positive Value |
     *
     ***Notes:**
     ***Default value 14**..
     */
    actorFontSize: 14,
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| actorFontFamily |This sets the font family of the actor's description | 3 | 4 | Open-Sans, Sans-Serif |
     *
     ***Notes:**
     ***Default value "Open-Sans", "sans-serif"**.
     */
    actorFontFamily: '"Open-Sans", "sans-serif"',
    /**
     * This sets the font weight of the actor's description
     * **Default value 400.
     */
    actorFontWeight: 400,
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| noteFontSize |This sets the font size of actor-attached notes. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 14**..
     */
    noteFontSize: 14,
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| noteFontFamily| This sets the font family of actor-attached notes. | String | Required |  trebuchet ms, verdana, arial |
     *
     ***Notes:**
     ***Default value: trebuchet ms **.
     */
    noteFontFamily: '"trebuchet ms", verdana, arial',
    /**
     * This sets the font weight of the note's description
     * **Default value 400.
     */
    noteFontWeight: 400,
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| noteAlign | This sets the text alignment of actor-attached notes. | string | required | left, center, right|
     *
     ***Notes:**
     ***Default value center**.
     */
    noteAlign: 'center',
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageFontSize | This sets the font size of actor messages. | Integer | Required | Any Positive Number |
     *
     ***Notes:**
     ***Default value 16**.
     */
    messageFontSize: 16,
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageFontFamily | This sets the font family of actor messages. | String| Required | trebuchet ms", verdana, aria |
     *
     ***Notes:**
     ***Default value:"trebuchet ms**.
     */
    messageFontFamily: '"trebuchet ms", verdana, arial',
    /**
     * This sets the font weight of the message's description
     * **Default value 400.
     */
    messageFontWeight: 400,
    /**
     * This sets the auto-wrap state for the diagram
     * **Default value false.
     */
    wrapEnabled: false,
    /**
     * This sets the auto-wrap padding for the diagram (sides only)
     * **Default value 15.
     */
    wrapPadding: 15
  },

  /**
   * The object containing configurations specific for gantt diagrams*
   */
  gantt: {
    /**
     *### titleTopMargin
     *
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| titleTopMargin | Margin top for the text over the gantt diagram | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 25**.
     */
    titleTopMargin: 25,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| barHeight | The height of the bars in the graph | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 20**.
     */
    barHeight: 20,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| barGap | The margin between the different activities in the gantt diagram. | Integer | Optional |Any Positive Value |
     *
     ***Notes:**
     ***Default value 4**.
     */
    barGap: 4,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| topPadding | Margin between title and gantt diagram and between axis and gantt diagram. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 50**.
     */
    topPadding: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| leftPadding | The space allocated for the section name to the left of the activities. | Integer| Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 75**.
     */
    leftPadding: 75,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| gridLineStartPadding | Vertical starting position of the grid lines. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 35**.
     */
    gridLineStartPadding: 35,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| fontSize | Font size| Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 11**.
     */
    fontSize: 11,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| fontFamily | font Family | string | required |"Open-Sans", "sans-serif" |
     *
     ***Notes:**
     *
     ***Default value '"Open-Sans", "sans-serif"'**.
     */
    fontFamily: '"Open-Sans", "sans-serif"',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| numberSectionStyles | The number of alternating section styles | Integer | 4 | Any Positive Value |
     *
     ***Notes:**
     ***Default value 4**.
     */
    numberSectionStyles: 4,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| axisFormat | Datetime format of the axis. | 3 | Required | Date in yy-mm-dd |
     *
     ***Notes:**
     *
     * This might need adjustment to match your locale and preferences
     ***Default value '%Y-%m-%d'**.
     */
    axisFormat: '%Y-%m-%d'
  },
  /**
   * The object containing configurations specific for sequence diagrams
   */
  journey: {
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| diagramMarginX | margin to the right and left of the sequence diagram | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 50**.
     */
    diagramMarginX: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| diagramMarginY | margin to the over and under the sequence diagram. | Integer | Required | Any Positive Value|
     *
     ***Notes:**
     ***Default value 10**..
     */
    diagramMarginY: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| actorMargin | Margin between actors. | Integer | Required | Any Positive Value|
     *
     ***Notes:**
     ***Default value 50**.
     */
    actorMargin: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| width | Width of actor boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 150**.
     */
    width: 150,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| height | Height of actor boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 65**.
     */
    height: 65,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| boxMargin | Margin around loop boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 10**.
     */
    boxMargin: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| boxTextMargin | margin around the text in loop/alt/opt boxes | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     */
    boxTextMargin: 5,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| noteMargin | margin around notes. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     ***Default value 10**.
     */
    noteMargin: 10,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageMargin |Space between messages. | Integer | Required | Any Positive Value |
     *
     ***Notes:**
     *
     *Space between messages.
     ***Default value 35**.
     */
    messageMargin: 35,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| messageAlign |Multiline message alignment | 3 | 4 | left, center, right |
     *
     ***Notes:**default:center**
     */
    messageAlign: 'center',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| bottomMarginAdj | Prolongs the edge of the diagram downwards. | Integer | 4 | Any Positive Value |
     *
     ***Notes:**Depending on css styling this might need adjustment.
     ***Default value 1**.
     */
    bottomMarginAdj: 1,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| useMaxWidth | See notes | Boolean | 4 | True, False |
     *
     ***Notes:**when this flag is set the height and width is set to 100% and is then scaling with the
     *available space if not the absolute space required is used.
     *
     ***Default value true**.
     */
    useMaxWidth: true,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| rightAngles | Curved Arrows become Right Angles,  | 3 | 4 | True, False |
     *
     ***Notes:**This will display arrows that start and begin at the same node as right angles, rather than a curves
     ***Default value false**.
     */
    rightAngles: false
  },
  class: {},
  git: {},
  state: {
    dividerMargin: 10,
    sizeUnit: 5,
    padding: 8,
    textHeight: 10,
    titleShift: -15,
    noteMargin: 10,
    forkWidth: 70,
    forkHeight: 7,
    // Used
    miniPadding: 2,
    // Font size factor, this is used to guess the width of the edges labels before rendering by dagre
    // layout. This might need updating if/when switching font
    fontSizeFactor: 5.02,
    fontSize: 24,
    labelHeight: 16,
    edgeLengthFactor: '20',
    compositTitleSize: 35,
    radius: 5
  },

  /**
   * The object containing configurations specific for entity relationship diagrams
   */
  er: {
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| diagramPadding | amount of padding around the diagram as a whole | Integer | Required | Any Positive Value |
     *
     ***Notes:**The amount of padding around the diagram as a whole so that embedded diagrams have margins, expressed in pixels
     ***Default value: 20**.
     */
    diagramPadding: 20,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| layoutDirection | Directional bias for layout of entities. | String | Required | "TB", "BT","LR","RL" |
     *
     ***Notes:**
     *'TB' for Top-Bottom, 'BT'for Bottom-Top, 'LR' for Left-Right, or 'RL' for Right to Left.
     * T = top, B = bottom, L = left, and R = right.
     ***Default value: TB **.
     */
    layoutDirection: 'TB',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| minEntityWidth | The mimimum width of an entity box, | Integer | Required| Any Positive Value  |
     *
     ***Notes:**expressed in pixels
     ***Default value: 100**.
     */
    minEntityWidth: 100,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| minEntityHeight| The minimum height of an entity box, | Integer | 4 | Any Positive Value |
     *
     ***Notes:**expressed in pixels
     ***Default value: 75 **
     */
    minEntityHeight: 75,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| entityPadding|minimum internal padding betweentext in box and  box borders| Integer | 4 | Any Positive Value |
     *
     ***Notes:**The minimum internal padding betweentext in an entity box and the enclosing box borders, expressed in pixels.
     ***Default value: 15 **
     */
    entityPadding: 15,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| stroke | Stroke color of box edges and lines | String | 4 | Any recognized color |
     ***Default value: gray **
     */
    stroke: 'gray',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| fill | Fill color of entity boxes | String | 4 | Any recognized color |
     *
     ***Notes:**
     ***Default value:'honeydew'**
     */
    fill: 'honeydew',

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| fontSize| Font Size in pixels| Integer |  | Any Positive Value |
     *
     ***Notes:**Font size (expressed as an integer representing a number of  pixels)
     ***Default value: 12 **
     */
    fontSize: 12
  }
};

setLogLevel(config.logLevel);
setConfig(config);

function parse(text) {
  const graphInit = utils.detectInit(text);
  if (graphInit) {
    reinitialize(graphInit);
    logger.debug('Init ', graphInit);
  }
  const graphType = utils.detectType(text);
  let parser;

  logger.debug('Type ' + graphType);
  switch (graphType) {
    case 'git':
      parser = gitGraphParser;
      parser.parser.yy = gitGraphAst;
      break;
    case 'flowchart':
      flowDb.clear();
      parser = flowParser;
      parser.parser.yy = flowDb;
      break;
    case 'flowchart-v2':
      flowDb.clear();
      parser = flowParser;
      parser.parser.yy = flowDb;
      break;
    case 'sequence':
      parser = sequenceParser;
      parser.parser.yy = sequenceDb;
      break;
    case 'gantt':
      parser = ganttParser;
      parser.parser.yy = ganttDb;
      break;
    case 'class':
      parser = classParser;
      parser.parser.yy = classDb;
      break;
    case 'state':
      parser = stateParser;
      parser.parser.yy = stateDb;
      break;
    case 'stateDiagram':
      parser = stateParser;
      parser.parser.yy = stateDb;
      break;
    case 'info':
      logger.debug('info info info');
      parser = infoParser;
      parser.parser.yy = infoDb;
      break;
    case 'pie':
      logger.debug('pie');
      parser = pieParser;
      parser.parser.yy = pieDb;
      break;
    case 'er':
      logger.debug('er');
      parser = erParser;
      parser.parser.yy = erDb;
      break;
    case 'journey':
      logger.debug('Journey');
      parser = journeyParser;
      parser.parser.yy = journeyDb;
      break;
  }

  parser.parser.yy.parseError = (str, hash) => {
    const error = { str, hash };
    throw error;
  };

  parser.parse(text);
}

export const encodeEntities = function(text) {
  let txt = text;

  txt = txt.replace(/style.*:\S*#.*;/g, function(s) {
    const innerTxt = s.substring(0, s.length - 1);
    return innerTxt;
  });
  txt = txt.replace(/classDef.*:\S*#.*;/g, function(s) {
    const innerTxt = s.substring(0, s.length - 1);
    return innerTxt;
  });

  txt = txt.replace(/#\w+;/g, function(s) {
    const innerTxt = s.substring(1, s.length - 1);

    const isInt = /^\+?\d+$/.test(innerTxt);
    if (isInt) {
      return 'ﬂ°°' + innerTxt + '¶ß';
    } else {
      return 'ﬂ°' + innerTxt + '¶ß';
    }
  });

  return txt;
};

export const decodeEntities = function(text) {
  let txt = text;

  txt = txt.replace(/ﬂ°°/g, function() {
    return '&#';
  });
  txt = txt.replace(/ﬂ°/g, function() {
    return '&';
  });
  txt = txt.replace(/¶ß/g, function() {
    return ';';
  });

  return txt;
};
/**
 * Function that renders an svg with a graph from a chart definition. Usage example below.
 *
 * ```js
 * mermaidAPI.initialize({
 *      startOnLoad:true
 *  });
 *  $(function(){
 *      const graphDefinition = 'graph TB\na-->b';
 *      const cb = function(svgGraph){
 *          console.log(svgGraph);
 *      };
 *      mermaidAPI.render('id1',graphDefinition,cb);
 *  });
 *```
 * @param id the id of the element to be rendered
 * @param txt the graph definition
 * @param cb callback which is called after rendering is finished with the svg code as inparam.
 * @param container selector to element in which a div with the graph temporarily will be inserted. In one is
 * provided a hidden div will be inserted in the body of the page instead. The element will be removed when rendering is
 * completed.
 */
const render = function(id, _txt, cb, container) {
  // Check the maximum allowed text size
  let txt = _txt;
  if (_txt.length > config.maxTextSize) {
    txt = 'graph TB;a[Maximum text size in diagram exceeded];style a fill:#faa';
  }

  if (typeof container !== 'undefined') {
    container.innerHTML = '';

    select(container)
      .append('div')
      .attr('id', 'd' + id)
      .attr('style', 'font-family: ' + config.fontFamily)
      .append('svg')
      .attr('id', id)
      .attr('width', '100%')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .append('g');
  } else {
    const existingSvg = document.getElementById(id);
    if (existingSvg) {
      existingSvg.remove();
    }
    const element = document.querySelector('#' + 'd' + id);
    if (element) {
      element.remove();
    }

    select('body')
      .append('div')
      .attr('id', 'd' + id)
      .append('svg')
      .attr('id', id)
      .attr('width', '100%')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .append('g');
  }

  window.txt = txt;
  txt = encodeEntities(txt);

  const element = select('#d' + id).node();
  const graphInit = utils.detectInit(txt);
  if (graphInit) {
    reinitialize(graphInit);
  }
  const graphType = utils.detectType(txt);

  // insert inline style into svg
  const svg = element.firstChild;
  const firstChild = svg.firstChild;

  // pre-defined theme
  let style = themes[config.theme];
  if (style === undefined) {
    style = '';
  }

  // user provided theme CSS
  if (config.themeCSS !== undefined) {
    style += `\n${config.themeCSS}`;
  }
  // user provided theme CSS
  if (config.fontFamily !== undefined) {
    style += `\n:root { --mermaid-font-family: ${config.fontFamily}}`;
  }
  // user provided theme CSS
  if (config.altFontFamily !== undefined) {
    style += `\n:root { --mermaid-alt-font-family: ${config.altFontFamily}}`;
  }

  // classDef
  if (graphType === 'flowchart' || graphType === 'flowchart-v2') {
    const classes = flowRenderer.getClasses(txt);
    for (const className in classes) {
      style += `\n.${className} > * { ${classes[className].styles.join(
        ' !important; '
      )} !important; }`;
      if (classes[className].textStyles) {
        style += `\n.${className} tspan { ${classes[className].textStyles.join(
          ' !important; '
        )} !important; }`;
      }
    }
  }

  const style1 = document.createElement('style');
  style1.innerHTML = scope(style, `#${id}`);
  svg.insertBefore(style1, firstChild);

  const style2 = document.createElement('style');
  const cs = window.getComputedStyle(svg);
  style2.innerHTML = `#${id} {
    color: ${cs.color};
    font: ${cs.font};
  }`;
  svg.insertBefore(style2, firstChild);

  try {
    switch (graphType) {
      case 'git':
        config.flowchart.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
        gitGraphRenderer.setConf(config.git);
        gitGraphRenderer.draw(txt, id, false);
        break;
      case 'flowchart':
        config.flowchart.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
        flowRenderer.setConf(config.flowchart);
        flowRenderer.draw(txt, id, false);
        break;
      case 'flowchart-v2':
        config.flowchart.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
        flowRendererV2.setConf(config.flowchart);
        flowRendererV2.draw(txt, id, false);
        break;
      case 'sequence':
        config.sequence.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
        if (config.sequenceDiagram) {
          // backwards compatibility
          sequenceRenderer.setConf(Object.assign(config.sequence, config.sequenceDiagram));
          console.error(
            '`mermaid config.sequenceDiagram` has been renamed to `config.sequence`. Please update your mermaid config.'
          );
        } else {
          sequenceRenderer.setConf(config.sequence);
        }
        sequenceRenderer.draw(txt, id);
        break;
      case 'gantt':
        config.gantt.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
        ganttRenderer.setConf(config.gantt);
        ganttRenderer.draw(txt, id);
        break;
      case 'class':
        config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
        classRenderer.setConf(config.class);
        classRenderer.draw(txt, id);
        break;
      case 'state':
        // config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
        stateRenderer.setConf(config.state);
        stateRenderer.draw(txt, id);
        break;
      case 'stateDiagram':
        // config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
        stateRendererV2.setConf(config.state);
        stateRendererV2.draw(txt, id);
        break;
      case 'info':
        config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
        infoRenderer.setConf(config.class);
        infoRenderer.draw(txt, id, pkg.version);
        break;
      case 'pie':
        config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
        pieRenderer.setConf(config.class);
        pieRenderer.draw(txt, id, pkg.version);
        break;
      case 'er':
        erRenderer.setConf(config.er);
        erRenderer.draw(txt, id, pkg.version);
        break;
      case 'journey':
        journeyRenderer.setConf(config.journey);
        journeyRenderer.draw(txt, id, pkg.version);
        break;
    }
  } catch (e) {
    errorRenderer.setConf(config.class);
    errorRenderer.draw(id, pkg.version);
    throw e;
  }

  select(`[id="${id}"]`)
    .selectAll('foreignobject > *')
    .attr('xmlns', 'http://www.w3.org/1999/xhtml');

  // if (config.arrowMarkerAbsolute) {
  //   url =
  //     window.location.protocol +
  //     '//' +
  //     window.location.host +
  //     window.location.pathname +
  //     window.location.search;
  //   url = url.replace(/\(/g, '\\(');
  //   url = url.replace(/\)/g, '\\)');
  // }

  // Fix for when the base tag is used
  let svgCode = select('#d' + id).node().innerHTML;

  if (!config.arrowMarkerAbsolute || config.arrowMarkerAbsolute === 'false') {
    svgCode = svgCode.replace(/marker-end="url\(.*?#/g, 'marker-end="url(#', 'g');
  }

  svgCode = decodeEntities(svgCode);

  if (typeof cb !== 'undefined') {
    switch (graphType) {
      case 'flowchart':
      case 'flowchart-v2':
        cb(svgCode, flowDb.bindFunctions);
        break;
      case 'gantt':
        cb(svgCode, ganttDb.bindFunctions);
        break;
      case 'class':
        cb(svgCode, classDb.bindFunctions);
        break;
      default:
        cb(svgCode);
    }
  } else {
    logger.debug('CB = undefined!');
  }

  const node = select('#d' + id).node();
  if (node !== null && typeof node.remove === 'function') {
    select('#d' + id)
      .node()
      .remove();
  }

  return svgCode;
};

const setConf = function(cnf) {
  // Top level initially mermaid, gflow, sequenceDiagram and gantt
  const lvl1Keys = Object.keys(cnf);
  for (let i = 0; i < lvl1Keys.length; i++) {
    if (typeof cnf[lvl1Keys[i]] === 'object' && cnf[lvl1Keys[i]] != null) {
      const lvl2Keys = Object.keys(cnf[lvl1Keys[i]]);

      for (let j = 0; j < lvl2Keys.length; j++) {
        logger.debug('Setting conf ', lvl1Keys[i], '-', lvl2Keys[j]);
        if (typeof config[lvl1Keys[i]] === 'undefined') {
          config[lvl1Keys[i]] = {};
        }
        logger.debug(
          'Setting config: ' +
            lvl1Keys[i] +
            ' ' +
            lvl2Keys[j] +
            ' to ' +
            cnf[lvl1Keys[i]][lvl2Keys[j]]
        );
        config[lvl1Keys[i]][lvl2Keys[j]] = cnf[lvl1Keys[i]][lvl2Keys[j]];
      }
    } else {
      config[lvl1Keys[i]] = cnf[lvl1Keys[i]];
    }
  }
};

function reinitialize(options) {
  if (typeof options === 'object') {
    setConf(options);
  }
  setConfig(config);
  setLogLevel(config.logLevel);
  logger.debug('RE-Initializing mermaidAPI ', { version: pkg.version, options, config });
}

function initialize(options) {
  let _config = config;
  logger.debug('Initializing mermaidAPI ', { version: pkg.version, options, _config });
  // Update default config with options supplied at initialization
  if (typeof options === 'object') {
    _config = Object.assign(_config, options);
    setConf(_config);
  }
  setConfig(_config);
  setLogLevel(_config.logLevel);
}

// function getConfig () {
//   console.warn('get config')
//   return config
// }

const mermaidAPI = {
  render,
  parse,
  initialize,
  reinitialize,
  getConfig
};

export default mermaidAPI;
/**
 * ## mermaidAPI configuration defaults
 * <pre>
 *
 * &lt;script>
 *   var config = {
 *     theme:'default',
 *     logLevel:'fatal',
 *     securityLevel:'strict',
 *     startOnLoad:true,
 *     arrowMarkerAbsolute:false,
 *
 *     flowchart:{
 *       htmlLabels:true,
 *       curve:'linear',
 *     },
 *     sequence:{
 *       diagramMarginX:50,
 *       diagramMarginY:10,
 *       actorMargin:50,
 *       width:150,
 *       height:65,
 *       boxMargin:10,
 *       boxTextMargin:5,
 *       noteMargin:10,
 *       messageMargin:35,
 *       messageAlign:'center',
 *       mirrorActors:true,
 *       bottomMarginAdj:1,
 *       useMaxWidth:true,
 *       rightAngles:false,
 *       showSequenceNumbers:false,
 *     },
 *     gantt:{
 *       titleTopMargin:25,
 *       barHeight:20,
 *       barGap:4,
 *       topPadding:50,
 *       leftPadding:75,
 *       gridLineStartPadding:35,
 *       fontSize:11,
 *       fontFamily:'"Open-Sans", "sans-serif"',
 *       numberSectionStyles:4,
 *       axisFormat:'%Y-%m-%d',
 *     }
 *   };
 *   mermaid.initialize(config);
 * &lt;/script>
 *</pre>
 */
