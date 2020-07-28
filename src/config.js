import { assignWithDepth } from './utils';
import { logger } from './logger';
import theme from './themes';

// import { unflatten } from 'flat';
// import flatten from 'flat';

// import themeVariables from './theme-default';
// import themeForestVariables from './theme-forest';
// import themeNeutralVariables from './theme-neutral';

const handleThemeVariables = value => {
  return theme[value] ? theme[value].getThemeVariables() : theme.default.getThemeVariables();
};

const manipulators = {
  themeVariables: handleThemeVariables
};

/**
 * **Configuration methods in Mermaid version 8.6.0 have been updated, to learn more[[click here](8.6.0_docs.md)].**
 *
 * ## **What follows are config instructions for older versions**
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
 * A summary of all options and their defaults is found [here](#mermaidapi-configuration-defaults). A description of each option follows below.
 *
 * @name Configuration
 */
const config = {
  /** theme , the CSS style sheet
   *
   * theme , the CSS style sheet
   *
   *| Parameter | Description |Type | Required | Values|
   *| --- | --- | --- | --- | --- |
   *| Theme |Built in Themes| String | Optional | Values include, default, forest, dark, neutral, null|
   *
   ***Notes:**To disable any pre-defined mermaid theme, use "null".
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
   *| securitylevel | Level of trust for parsed diagram|String | Required | Strict, Loose, antiscript |
   *
   ***Notes:
   *-   **strict**: (**default**) tags in text are encoded, click functionality is disabeled
   *-   **loose**: tags in text are allowed, click functionality is enabled
   *-   **antiscript**: html tags in text are allowed, (only script element is removed), click functionality is enabled
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
   * This option controls which currentConfig keys are considered _secure_ and can only be changed via
   * call to mermaidAPI.initialize. Calls to mermaidAPI.reinitialize cannot make changes to
   * the `secure` keys in the current currentConfig. This prevents malicious graph directives from
   * overriding a site's default security.
   */
  secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize'],

  /**
   * The object containing configurations specific for flowcharts
   */
  flowchart: {
    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| diagramPadding | amount of padding around the diagram as a whole | Integer | Required | Any Positive Value |
     *
     ***Notes:**The amount of padding around the diagram as a whole so that embedded diagrams have margins, expressed in pixels
     ***Default value: 8**.
     */
    diagramPadding: 8,

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
     * widt of the activation rect
     * **Default value 10**.
     */
    activationWidth: 10,

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
    wrap: false,
    /**
     * This sets the auto-wrap padding for the diagram (sides only)
     * **Default value 10.
     */
    wrapPadding: 10,
    /**
     * This sets the width of the loop-box (loop, alt, opt, par)
     * **Default value 50.
     */
    labelBoxWidth: 50,
    /**
     * This sets the height of the loop-box (loop, alt, opt, par)
     * **Default value 20.
     */
    labelBoxHeight: 20,
    messageFont: function() {
      return {
        fontFamily: this.messageFontFamily,
        fontSize: this.messageFontSize,
        fontWeight: this.messageFontWeight
      };
    },
    noteFont: function() {
      return {
        fontFamily: this.noteFontFamily,
        fontSize: this.noteFontSize,
        fontWeight: this.noteFontWeight
      };
    },
    actorFont: function() {
      return {
        fontFamily: this.actorFontFamily,
        fontSize: this.actorFontSize,
        fontWeight: this.actorFontWeight
      };
    }
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
   * The object containing configurations specific for journey diagrams
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
  class: {
    arrowMarkerAbsolute: false
  },
  git: {
    arrowMarkerAbsolute: false
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
     ***Notes:**Font size (expressed as an integer representing a number of pixels)
     ***Default value: 12 **
     */
    fontSize: 12,

    /**
     *| Parameter | Description |Type | Required | Values|
     *| --- | --- | --- | --- | --- |
     *| useMaxWidth | See Notes | Boolean | Required | true, false |
     *
     ***Notes:**
     *When this flag is set to true, the diagram width is locked to 100% and
     *scaled based on available space. If set to false, the diagram reserves its
     *absolute width.
     ***Default value: true**.
     */
    useMaxWidth: true
  }
};

// debugger;
config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
config.git.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
export const defaultConfig = Object.freeze(config);

const siteConfig = assignWithDepth({}, defaultConfig);
const currentConfig = assignWithDepth({}, defaultConfig);

/**
 *## setSiteConfig
 *| Function | Description         | Type    | Values             |
 *| --------- | ------------------- | ------- | ------------------ |
 *| setSiteConfig|Sets the siteConfig to desired values | Put Request | Any Values, except ones in secure array|
 ***Notes:**
 *Sets the siteConfig. The siteConfig is a protected configuration for repeat use. Calls to reset() will reset
 *the currentConfig to siteConfig. Calls to reset(configApi.defaultConfig) will reset siteConfig and currentConfig
 *to the defaultConfig
 *Note: currentConfig is set in this function
 **Default value: At default, will mirror Global Config**
 * @param conf - the base currentConfig to use as siteConfig
 * @returns {*} - the siteConfig
 */
export const setSiteConfig = conf => {
  Object.keys(conf).forEach(key => {
    const manipulator = manipulators[key];
    conf[key] = manipulator ? manipulator(conf[key]) : conf[key];
  });

  assignWithDepth(currentConfig, conf, { clobber: true });
  // Set theme variables if user has set the theme option
  assignWithDepth(siteConfig, conf);

  return getSiteConfig();
};
/**
 *## getSiteConfig
 *| Function | Description         | Type    |  Values             |
 *| --------- | ------------------- | ------- |  ------------------ |
 *| setSiteConfig|Returns the current siteConfig base configuration | Get Request | Returns Any Values  in siteConfig|
 ***Notes**:
 *Returns **any** values in siteConfig.
 * @returns {*}
 */
export const getSiteConfig = () => {
  return assignWithDepth({}, siteConfig);
};
/**
 *## setConfig
 *| Function  | Description         | Type    | Values             |
 *| --------- | ------------------- | ------- | ------------------ |
 *| setSiteConfig|Sets the siteConfig to desired values | Put Request| Any Values, except ones in secure array|
 ***Notes**:
 *Sets the currentConfig. The parameter conf is sanitized based on the siteConfig.secure keys. Any
 *values found in conf with key found in siteConfig.secure will be replaced with the corresponding
 *siteConfig value.
 * @param conf - the potential currentConfig
 * @returns {*} - the currentConfig merged with the sanitized conf
 */
export const setConfig = conf => {
  sanitize(conf);
  Object.keys(conf).forEach(key => {
    const manipulator = manipulators[key];
    conf[key] = manipulator ? manipulator(conf[key]) : conf[key];
  });

  assignWithDepth(currentConfig, conf);
  return getConfig();
};
/**
 *   ## getConfig
 *| Function  | Description         | Type    | Return Values            |
 *| --------- | ------------------- | ------- | ------------------ |
 *| getConfig |Obtains the currentConfig | Get Request | Any Values from currentConfig|
 ***Notes**:
 *Returns **any** the currentConfig
 * @returns {*} - the currentConfig
 */
export const getConfig = () => {
  return assignWithDepth({}, currentConfig);
};
/**
 *## sanitize
 *| Function | Description         | Type    | Values             |
 *| --------- | ------------------- | ------- | ------------------ |
 *| sanitize  |Sets the siteConfig to desired values. | Put Request |None|
 *Ensures options parameter does not attempt to override siteConfig secure keys
 *Note: modifies options in-place
 * @param options - the potential setConfig parameter
 */
export const sanitize = options => {
  Object.keys(siteConfig.secure).forEach(key => {
    if (typeof options[siteConfig.secure[key]] !== 'undefined') {
      // DO NOT attempt to print options[siteConfig.secure[key]] within `${}` as a malicious script
      // can exploit the logger's attempt to stringify the value and execute arbitrary code
      logger.warn(
        `Denied attempt to modify a secure key ${siteConfig.secure[key]}`,
        options[siteConfig.secure[key]]
      );
      delete options[siteConfig.secure[key]];
    }
  });
};
/**
 *## reset
 *| Function | Description         | Type    | Required | Values             |
 *| --------- | ------------------- | ------- | -------- | ------------------ |
 *| reset|Resets currentConfig to conf| Put Request | Required | None|
 *
 *| Parameter | Description |Type | Required | Values|
 *| --- | --- | --- | --- | --- |
 *| conf| base set of values, which currentConfig coul be **reset** to.| Dictionary | Required | Any Values, with respect to the secure Array|
 *
 **Notes :
 (default: current siteConfig ) (optional, default `getSiteConfig()`)
 * @param conf - the base currentConfig to reset to (default: current siteConfig )
 */
export const reset = (conf = getSiteConfig()) => {
  Object.keys(siteConfig).forEach(key => delete siteConfig[key]);
  Object.keys(currentConfig).forEach(key => delete currentConfig[key]);
  assignWithDepth(siteConfig, conf, { clobber: true });
  assignWithDepth(currentConfig, conf, { clobber: true });
};

const configApi = Object.freeze({
  sanitize,
  setSiteConfig,
  getSiteConfig,
  setConfig,
  getConfig,
  reset,
  defaultConfig
});
export default configApi;
