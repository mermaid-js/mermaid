import theme from './themes';
/**
 * **Configuration methods in Mermaid version 8.6.0 have been updated, to learn more[[click here](8.6.0_docs.md)].**
 *
 * ## **What follows are config instructions for older versions**
 *
 * These are the default options which can be overridden with the initialization call like so:
 *
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
 * A summary of all options and their defaults is found [here](#mermaidapi-configuration-defaults). A description of each option follows below.
 *
 * @name Configuration
 */
const config = {
  /**
   * theme , the CSS style sheet
   *
   * | Parameter | Description | Type | Required | Values |
   * | --- | --- | --- | --- | --- |
   * | theme | Built in Themes | string | Optional | 'default', 'forest', 'dark', 'neutral', 'null'|
   *
   * **Notes:** To disable any pre-defined mermaid theme, use "null".
   *
   * <pre>
   *  "theme": "forest",
   *  "themeCSS": ".node rect { fill: red; }"
   * </pre>
   */
  theme: 'default',
  themeVariables: theme['default'].getThemeVariables(),
  themeCSS: undefined,
  /* **maxTextSize** - The maximum allowed size of the users text diamgram */
  maxTextSize: 50000,

  /**
   * | Parameter | Description | Type | Required | Values |
   * | --- | --- | --- | --- | --- |
   * | fontFamily | specifies the font to be used in the rendered diagrams| string | Required | Any Posiable CSS FontFamily |
   *
   * **Notes:**
   * Default value: '"trebuchet ms", verdana, arial, sans-serif;'.
   */
  fontFamily: '"trebuchet ms", verdana, arial, sans-serif;',

  /**
   * | Parameter | Description | Type | Required | Values |
   * | --- | --- | --- | --- | --- |
   * | logLevel |This option decides the amount of logging to be used.| string \| number | Required | 1, 2, 3, 4, 5 |
   *
   *
   * **Notes:**
   *
   * - debug: 1
   * - info: 2
   * - warn: 3
   * - error: 4
   * - fatal: 5 (default)
   */
  logLevel: 5,

  /**
   * | Parameter | Description | Type | Required | Values |
   * | --- | --- | --- | --- | --- |
   * | securitylevel | Level of trust for parsed diagram|string | Required | 'strict', 'loose', 'antiscript' |
   *
   * **Notes**:
   *
   * - **strict**: (**default**) tags in text are encoded, click functionality is disabled
   * - **loose**: tags in text are allowed, click functionality is enabled
   * - **antiscript**: html tags in text are allowed, (only script element is removed), click functionality is enabled
   */
  securityLevel: 'strict',

  /**
   * | Parameter | Description | Type | Required | Values |
   * | --- | --- | --- | --- | --- |
   * | startOnLoad | Dictates whether mermaind starts on Page load | boolean | Required | true, false |
   *
   * **Notes:** Default value: true
   */
  startOnLoad: true,

  /**
   * | Parameter | Description |Type | Required |Values|
   * | --- | --- | --- | --- | --- |
   * | arrowMarkerAbsolute | Controls whether or arrow markers in html code are absolute paths or anchors | boolean | Required | true, false |
   *
   *
   * **Notes**:
   *
   * This matters if you are using base tag settings.
   *
   * Default value: false
   */
  arrowMarkerAbsolute: false,

  /**
   * This option controls which currentConfig keys are considered _secure_ and can only be changed via
   * call to mermaidAPI.initialize. Calls to mermaidAPI.reinitialize cannot make changes to
   * the `secure` keys in the current currentConfig. This prevents malicious graph directives from
   * overriding a site's default security.

   * **Notes**:
   *
   * Default value: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize']
   */
  secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize'],

  /**
   * This option controls if the generated ids of nodes in the SVG are generated randomly or based on a seed.
   * If set to false, the IDs are generated based on the current date and thus are not deterministic. This is the default behaviour.
   *
   * **Notes**:
   *
   * This matters if your files are checked into sourcecontrol e.g. git and should not change unless content is changed.
   *
   * Default value: false
   */
  deterministicIds: false,

  /**
   * This option is the optional seed for deterministic ids. if set to undefined but deterministicIds is true, a simple number iterator is used.
   * You can set this attribute to base the seed on a static string.
   */
  deterministicIDSeed: undefined,

  /**
   * The object containing configurations specific for flowcharts
   */
  flowchart: {
    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | diagramPadding | Amount of padding around the diagram as a whole | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     *
     * The amount of padding around the diagram as a whole so that embedded diagrams have margins, expressed in pixels
     *
     * Default value: 8
     */
    diagramPadding: 8,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | htmlLabels | Flag for setting whether or not a html tag should be used for rendering labels on the edges. | boolean| Required | true, false |
     *
     * **Notes:** Default value: true.
     */
    htmlLabels: true,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | nodeSpacing | Defines the spacing between nodes on the same level | Integer | Required | Any positive Number |
     *
     * **Notes:**
     *
     * Pertains to horizontal spacing for TB (top to bottom) or BT (bottom to top) graphs, and the vertical spacing for LR as well as RL graphs.**
     *
     * Default value: 50
     */
    nodeSpacing: 50,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | rankSpacing | Defines the spacing between nodes on different levels | Integer | Required | Any Positive Number |
     *
     * **Notes**:
     *
     * pertains to vertical spacing for TB (top to bottom) or BT (bottom to top), and the horizontal spacing for LR as well as RL graphs.
     *
     * Default value 50
     */
    rankSpacing: 50,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | curve | Defines how mermaid renders curves for flowcharts. | string | Required | 'basis', 'linear', 'cardinal'|
     *
     * **Notes:**
     *
     * Default Vaue: 'basis'
     */
    curve: 'basis',
    // Only used in new experimental rendering
    // represents the padding between the labels and the shape
    padding: 15,

    /**
     * | Parameter | Description | Type | Required | Values|
     * | --- | --- | --- | --- | --- |
     * | useMaxWidth | See notes | boolean | 4 | true, false |
     *
     * **Notes:**
     *
     * When this flag is set the height and width is set to 100% and is then scaling with the
     * available space if not the absolute space required is used.
     *
     * Default value: true
     */
    useMaxWidth: true,

    /**
     * | Parameter | Description | Type | Required | Values|
     * | --- | --- | --- | --- | --- |
     * | defaultRenderer | See notes | boolean | 4 | dagre-d3, dagre-wrapper |
     *
     * **Notes:**
     *
     * Decides which rendering engine that is to be used for the rendering. Legal values are:
     * * dagre-d3
     * * dagre-wrapper - wrapper for dagre implemented in mermaid
     *
     * Default value: 'dagre-d3'
     */
    defaultRenderer: 'dagre-d3',
  },

  /**
   * The object containing configurations specific for sequence diagrams
   */
  sequence: {
    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | activationWidth | Width of the activation rect | Integer | Required | Any Positive Value |
     *
     *
     * **Notes:** Default value :10
     */
    activationWidth: 10,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | diagramMarginX | Margin to the right and left of the sequence diagram | Integer | Required | Any Positive Value |
     *
     * **Notes:** Default value: 50
     */
    diagramMarginX: 50,

    /**
     *| Parameter | Description | Type | Required | Values |
     *| --- | --- | --- | --- | --- |
     *| diagramMarginY | Margin to the over and under the sequence diagram | Integer | Required | Any Positive Value |
     *
     * **Notes:** Default value: 10
     */
    diagramMarginY: 10,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | actorMargin | Margin between actors | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 50
     */
    actorMargin: 50,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | width | Width of actor boxes | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 150
     */
    width: 150,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | height | Height of actor boxes | Integer | Required | Any Positive Value|
     *
     * **Notes:**
     * Default value: 65
     */
    height: 65,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | boxMargin | Margin around loop boxes | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 10
     */
    boxMargin: 10,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | boxTextMargin | Margin around the text in loop/alt/opt boxes | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 5
     */
    boxTextMargin: 5,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | noteMargin | margin around notes | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 10
     */
    noteMargin: 10,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | messageMargin | Space between messages | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 35
     */
    messageMargin: 35,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | messageAlign | Multiline message alignment | string | Required | 'left', 'center', 'right' |
     *
     * **Notes:**
     * Default value: 'center'
     */
    messageAlign: 'center',

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | mirrorActors | Mirror actors under diagram | boolean | Required | true, false |
     *
     * **Notes:**
     * Default value: true
     */
    mirrorActors: true,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | bottomMarginAdj | Prolongs the edge of the diagram downwards | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     *
     * Depending on css styling this might need adjustment.
     *
     * Default value: 1
     */
    bottomMarginAdj: 1,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | useMaxWidth | See Notes | boolean | Required | true, false |
     *
     * **Notes:**
     * When this flag is set to true, the height and width is set to 100% and is then scaling with the
     * available space. If set to false, the absolute space required is used.
     *
     * Default value: true
     */
    useMaxWidth: true,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | rightAngles | display curve arrows as right angles | boolean | Required | true, false |
     *
     * **Notes:**
     *
     * This will display arrows that start and begin at the same node as right angles, rather than a curve
     *
     * Default value: false
     */
    rightAngles: false,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | showSequenceNumbers | This will show the node numbers | boolean | Required | true, false |
     *
     * **Notes:**
     * Default value: false
     */
    showSequenceNumbers: false,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | actorFontSize| This sets the font size of the actor's description | Integer | Require | Any Positive Value |
     *
     ***Notes:**
     ***Default value 14**..
     */
    actorFontSize: 14,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | actorFontFamily |This sets the font family of the actor's description | string | Required | Any Posiable CSS FontFamily |
     *
     * **Notes:**
     * Default value: "'Open-Sans", "sans-serif"'
     */
    actorFontFamily: '"Open-Sans", "sans-serif"',

    /**
     * This sets the font weight of the actor's description
     *
     * **Notes:**
     * Default value: 400.
     */
    actorFontWeight: 400,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | noteFontSize | This sets the font size of actor-attached notes | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 14
     */
    noteFontSize: 14,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | noteFontFamily| This sets the font family of actor-attached notes. | string | Required | Any Posiable CSS FontFamily |
     *
     * **Notes:**
     * Default value: ''"trebuchet ms", verdana, arial, sans-serif'
     */
    noteFontFamily: '"trebuchet ms", verdana, arial, sans-serif',

    /**
     * This sets the font weight of the note's description
     *
     * **Notes:**
     * Default value: 400
     */
    noteFontWeight: 400,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | noteAlign | This sets the text alignment of actor-attached notes | string | required | 'left', 'center', 'right'|
     *
     * **Notes:**
     * Default value: 'center'
     */
    noteAlign: 'center',

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | messageFontSize | This sets the font size of actor messages | Integer | Required | Any Positive Number |
     *
     * **Notes:**
     * Default value: 16
     */
    messageFontSize: 16,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | messageFontFamily | This sets the font family of actor messages | string | Required | Any Posiable CSS FontFamily |
     *
     * **Notes:**
     * Default value: '"trebuchet ms", verdana, arial, sans-serif'
     */
    messageFontFamily: '"trebuchet ms", verdana, arial, sans-serif',

    /**
     * This sets the font weight of the message's description
     *
     * **Notes:**
     * Default value: 400.
     */
    messageFontWeight: 400,

    /**
     * This sets the auto-wrap state for the diagram
     *
     * **Notes:**
     * Default value: false.
     */
    wrap: false,

    /**
     * This sets the auto-wrap padding for the diagram (sides only)
     *
     * **Notes:**
     * Default value: 0.
     */
    wrapPadding: 10,

    /**
     * This sets the width of the loop-box (loop, alt, opt, par)
     *
     * **Notes:**
     * Default value: 50.
     */
    labelBoxWidth: 50,

    /**
     * This sets the height of the loop-box (loop, alt, opt, par)
     *
     * **Notes:**
     * Default value: 20.
     */
    labelBoxHeight: 20,

    messageFont: function () {
      return {
        fontFamily: this.messageFontFamily,
        fontSize: this.messageFontSize,
        fontWeight: this.messageFontWeight,
      };
    },
    noteFont: function () {
      return {
        fontFamily: this.noteFontFamily,
        fontSize: this.noteFontSize,
        fontWeight: this.noteFontWeight,
      };
    },
    actorFont: function () {
      return {
        fontFamily: this.actorFontFamily,
        fontSize: this.actorFontSize,
        fontWeight: this.actorFontWeight,
      };
    },
  },

  /**
   * The object containing configurations specific for gantt diagrams
   */
  gantt: {
    /**
     * ### titleTopMargin
     *
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | titleTopMargin | Margin top for the text over the gantt diagram | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 25
     */
    titleTopMargin: 25,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | barHeight | The height of the bars in the graph | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 20
     */
    barHeight: 20,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | barGap | The margin between the different activities in the gantt diagram | Integer | Optional | Any Positive Value |
     *
     * **Notes:**
     * Default value: 4
     */
    barGap: 4,

    /**
     * | Parameter | Description | Type | Required | Values|
     * | --- | --- | --- | --- | --- |
     * | topPadding | Margin between title and gantt diagram and between axis and gantt diagram. | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 50
     */
    topPadding: 50,

    /**
     * | Parameter | Description | Type | Required | Values|
     * | --- | --- | --- | --- | --- |
     * | rightPadding | The space allocated for the section name to the right of the activities | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 75
     */
    rightPadding: 75,

    /**
     * | Parameter | Description | Type | Required | Values|
     * | --- | --- | --- | --- | --- |
     * | leftPadding | The space allocated for the section name to the left of the activities | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 75
     */
    leftPadding: 75,

    /**
     * | Parameter | Description | Type | Required | Values|
     * | --- | --- | --- | --- | --- |
     * | gridLineStartPadding | Vertical starting position of the grid lines | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 35
     */
    gridLineStartPadding: 35,

    /**
     * | Parameter | Description | Type | Required | Values|
     * | --- | --- | --- | --- | --- |
     * | fontSize | Font size | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 11
     */
    fontSize: 11,

    /**
     * | Parameter | Description | Type | Required | Values|
     * | --- | --- | --- | --- | --- |
     * | sectionFontSize | Font size for secions| Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 11
     */
    sectionFontSize: 11,

    /**
     * | Parameter | Description | Type | Required | Values|
     * | --- | --- | --- | --- | --- |
     * | numberSectionStyles | The number of alternating section styles | Integer | 4 | Any Positive Value |
     *
     * **Notes:**
     * Default value: 4
     */
    numberSectionStyles: 4,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | axisFormat | Datetime format of the axis | 3 | Required | Date in yy-mm-dd |
     *
     * **Notes:**
     *
     * This might need adjustment to match your locale and preferences
     *
     * Default value: '%Y-%m-%d'.
     */
    axisFormat: '%Y-%m-%d',

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | useMaxWidth | See notes | boolean | 4 | true, false |
     *
     * **Notes:**
     *
     * When this flag is set the height and width is set to 100% and is then scaling with the
     * available space if not the absolute space required is used.
     *
     * Default value: true
     */
    useMaxWidth: true,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| topAxis | See notes | Boolean | 4 | True, False |
     *
     ***Notes:** when this flag is set date labels will be added to the
top of the chart
     *
     ***Default value false**.
     */
    topAxis: false,

    useWidth: undefined,
  },

  /**
   * The object containing configurations specific for journey diagrams
   */
  journey: {
    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | diagramMarginX | Margin to the right and left of the sequence diagram | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 50
     */
    diagramMarginX: 50,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | diagramMarginY | Margin to the over and under the sequence diagram. | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 10
     */
    diagramMarginY: 10,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | actorMargin | Margin between actors | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 50
     */
    leftMargin: 150,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | width | Width of actor boxes | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 150
     */
    width: 150,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | height | Height of actor boxes | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 65
     */
    height: 50,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| boxMargin | Margin around loop boxes | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 10
     */
    boxMargin: 10,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | boxTextMargin | Margin around the text in loop/alt/opt boxes | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 5
     */
    boxTextMargin: 5,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | noteMargin | Margin around notes | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     * Default value: 10
     */
    noteMargin: 10,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | messageMargin |Space between messages. | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     *
     * Space between messages.
     *
     * Default value: 35
     */
    messageMargin: 35,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | messageAlign | Multiline message alignment | 3 | 4 | 'left', 'center', 'right' |
     *
     * **Notes:**
     * Default value: 'center'
     */
    messageAlign: 'center',

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | bottomMarginAdj | Prolongs the edge of the diagram downwards | Integer | 4 | Any Positive Value |
     *
     * **Notes:**
     *
     * Depending on css styling this might need adjustment.
     *
     * Default value: 1
     */
    bottomMarginAdj: 1,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | useMaxWidth | See notes | boolean | 4 | true, false |
     *
     * **Notes:**
     *
     * When this flag is set the height and width is set to 100% and is then scaling with the
     * available space if not the absolute space required is used.
     *
     * Default value: true
     */
    useMaxWidth: true,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | rightAngles | Curved Arrows become Right Angles | 3 | 4 | true, false |
     *
     * **Notes:**
     *
     * This will display arrows that start and begin at the same node as right angles, rather than a curves
     *
     * Default value: false
     */
    rightAngles: false,
    taskFontSize: 14,
    taskFontFamily: '"Open-Sans", "sans-serif"',
    taskMargin: 50,
    // width of activation box
    activationWidth: 10,

    // text placement as: tspan | fo | old only text as before
    textPlacement: 'fo',
    actorColours: ['#8FBC8F', '#7CFC00', '#00FFFF', '#20B2AA', '#B0E0E6', '#FFFFE0'],

    sectionFills: ['#191970', '#8B008B', '#4B0082', '#2F4F4F', '#800000', '#8B4513', '#00008B'],
    sectionColours: ['#fff'],
  },
  class: {
    arrowMarkerAbsolute: false,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | useMaxWidth | See notes | boolean | 4 | true, false |
     *
     * **Notes:**
     *
     * When this flag is set the height and width is set to 100% and is then scaling with the
     * available space if not the absolute space required is used.
     *
     * Default value: true
     */
    useMaxWidth: true,
    /**
     * | Parameter | Description | Type | Required | Values|
     * | --- | --- | --- | --- | --- |
     * | defaultRenderer | See notes | boolean | 4 | dagre-d3, dagre-wrapper |
     *
     * **Notes:**
     *
     * Decides which rendering engine that is to be used for the rendering. Legal values are:
     * * dagre-d3
     * * dagre-wrapper - wrapper for dagre implemented in mermaid
     *
     * Default value: 'dagre-d3'
     */
    defaultRenderer: 'dagre-d3',
  },
  git: {
    arrowMarkerAbsolute: false,

    useWidth: undefined,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | useMaxWidth | See notes | boolean | 4 | true, false |
     *
     * **Notes:**
     *
     * When this flag is set the height and width is set to 100% and is then scaling with the
     * available space if not the absolute space required is used.
     *
     * Default value: true
     */
    useMaxWidth: true,
  },
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
    radius: 5,
    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | useMaxWidth | See notes | boolean | 4 | true, false |
     *
     * **Notes:**
     *
     * When this flag is set the height and width is set to 100% and is then scaling with the
     * available space if not the absolute space required is used.
     *
     * Default value: true
     */
    useMaxWidth: true,
    /**
     * | Parameter | Description | Type | Required | Values|
     * | --- | --- | --- | --- | --- |
     * | defaultRenderer | See notes | boolean | 4 | dagre-d3, dagre-wrapper |
     *
     * **Notes:**
     *
     * Decides which rendering engine that is to be used for the rendering. Legal values are:
     * * dagre-d3
     * * dagre-wrapper - wrapper for dagre implemented in mermaid
     *
     * Default value: 'dagre-d3'
     */
    defaultRenderer: 'dagre-wrapper',
  },

  /**
   * The object containing configurations specific for entity relationship diagrams
   */
  er: {
    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | diagramPadding | Amount of padding around the diagram as a whole | Integer | Required | Any Positive Value |
     *
     * **Notes:**
     *
     * The amount of padding around the diagram as a whole so that embedded diagrams have margins, expressed in pixels
     *
     * Default value: 20
     */
    diagramPadding: 20,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | layoutDirection | Directional bias for layout of entities. | string | Required | "TB", "BT", "LR", "RL" |
     *
     * **Notes:**
     *
     * 'TB' for Top-Bottom, 'BT'for Bottom-Top, 'LR' for Left-Right, or 'RL' for Right to Left.
     *
     * T = top, B = bottom, L = left, and R = right.
     *
     * Default value: 'TB'
     */
    layoutDirection: 'TB',

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | minEntityWidth | The mimimum width of an entity box | Integer | Required | Any Positive Value  |
     *
     * **Notes:**
     * Expressed in pixels.
     * Default value: 100
     */
    minEntityWidth: 100,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | minEntityHeight| The minimum height of an entity box | Integer | 4 | Any Positive Value |
     *
     * **Notes:**
     * Expressed in pixels
     * Default value: 75
     */
    minEntityHeight: 75,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | entityPadding | Minimum internal padding betweentext in box and box borders | Integer | 4 | Any Positive Value |
     *
     * **Notes:**
     *
     * The minimum internal padding betweentext in an entity box and the enclosing box borders, expressed in pixels.
     *
     * Default value: 15
     */
    entityPadding: 15,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | stroke | Stroke color of box edges and lines | string | 4 | Any recognized color |
     *
     * **Notes:**
     * Default value: 'gray'
     */
    stroke: 'gray',

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | fill | Fill color of entity boxes | string | 4 | Any recognized color |
     *
     * **Notes:**
     * Default value: 'honeydew'
     */
    fill: 'honeydew',

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | fontSize | Font Size in pixels | Integer |  | Any Positive Value |
     *
     * **Notes:**
     *
     * Font size (expressed as an integer representing a number of pixels)
     * Default value: 12
     */
    fontSize: 12,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | useMaxWidth | See Notes | boolean | Required | true, false |
     *
     * **Notes:**
     *
     * When this flag is set to true, the diagram width is locked to 100% and
     * scaled based on available space. If set to false, the diagram reserves its
     * absolute width.
     *
     * Default value: true
     */
    useMaxWidth: true,
  },

  /**
   * The object containing configurations specific for pie diagrams
   */
  pie: {
    useWidth: undefined,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | useMaxWidth | See Notes | boolean | Required | true, false |
     *
     * **Notes:**
     *
     * When this flag is set to true, the diagram width is locked to 100% and
     * scaled based on available space. If set to false, the diagram reserves its
     * absolute width.
     *
     * Default value: true
     */
    useMaxWidth: true,
  },

  /**
   * The object containing configurations specific for req diagrams
   */
  requirement: {
    useWidth: undefined,

    /**
     * | Parameter | Description | Type | Required | Values |
     * | --- | --- | --- | --- | --- |
     * | useMaxWidth | See Notes | boolean | Required | true, false |
     *
     * **Notes:**
     *
     * When this flag is set to true, the diagram width is locked to 100% and
     * scaled based on available space. If set to false, the diagram reserves its
     * absolute width.
     *
     * Default value: true
     */
    useMaxWidth: true,

    rect_fill: '#f9f9f9',
    text_color: '#333',
    rect_border_size: '0.5px',
    rect_border_color: '#bbb',
    rect_min_width: 200,
    rect_min_height: 200,
    fontSize: 14,
    rect_padding: 10,
    line_height: 20,
  },
};

config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
config.git.arrowMarkerAbsolute = config.arrowMarkerAbsolute;

export default config;
