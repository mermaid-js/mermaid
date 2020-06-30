import { assignWithDepth } from './utils';
import { logger } from './logger';

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
 *   var currentConfig = {
 *     startOnLoad:true,
 *     flowchart:{
 *       useMaxWidth:true,
 *       htmlLabels:true,
 *       curve:'cardinal',
 *     },
 *
 *     securityLevel:'loose',
 *   };
 *   mermaid.initialize(currentConfig);
 * &lt;/script>
 * </pre>
 * A summary of all options and their defaults is found [here](https://github.com/knsv/mermaid/blob/master/docs/mermaidAPI.md#mermaidapi-configuration-defaults). A description of each option follows below.
 *
 * @name Configuration
 */
const config = {
  /** theme , the CSS style sheet
   *
   * **theme** - Choose one of the built-in themes:
   *    * default
   *    * forest
   *    * dark
   *    * neutral.
   * To disable any pre-defined mermaid theme, use "null".
   *
   * **themeCSS** - Use your own CSS. This overrides **theme**.
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
   * **fontFamily** The font to be used for the rendered diagrams. Default value is \"trebuchet ms\", verdana, arial;
   */
  fontFamily: '"trebuchet ms", verdana, arial;',

  /**
   * This option decides the amount of logging to be used.
   *    * debug: 1
   *    * info: 2
   *    * warn: 3
   *    * error: 4
   *    * fatal: (**default**) 5
   */
  logLevel: 5,

  /**
   * Sets the level of trust to be used on the parsed diagrams.
   *  * **strict**: (**default**) tags in text are encoded, click functionality is disabeled
   *  * **loose**: tags in text are allowed, click functionality is enabled
   */
  securityLevel: 'strict',

  /**
   * This options controls whether or mermaid starts when the page loads
   * **Default value true**.
   */
  startOnLoad: true,

  /**
   * This options controls whether or arrow markers in html code will be absolute paths or
   * an anchor, #. This matters if you are using base tag settings.
   * **Default value false**.
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
     * Flag for setting whether or not a html tag should be used for rendering labels
     * on the edges.
     * **Default value true**.
     */
    htmlLabels: true,

    /**
     * Defines the spacing between nodes on the same level (meaning horizontal spacing for
     * TB or BT graphs, and the vertical spacing for LR as well as RL graphs).
     * **Default value 50**.
     */
    nodeSpacing: 50,

    /**
     * Defines the spacing between nodes on different levels (meaning vertical spacing for
     * TB or BT graphs, and the horizontal spacing for LR as well as RL graphs).
     * **Default value 50**.
     */
    rankSpacing: 50,

    /**
     * How mermaid renders curves for flowcharts. Possible values are
     *   * basis
     *   * linear **default**
     *   * cardinal
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
     * margin to the right and left of the sequence diagram.
     * **Default value 50**.
     */
    diagramMarginX: 50,

    /**
     * margin to the over and under the sequence diagram.
     * **Default value 10**.
     */
    diagramMarginY: 10,

    /**
     * Margin between actors.
     * **Default value 50**.
     */
    actorMargin: 50,

    /**
     * Width of actor boxes
     * **Default value 150**.
     */
    width: 150,

    /**
     * Height of actor boxes
     * **Default value 65**.
     */
    height: 65,

    /**
     * Margin around loop boxes
     * **Default value 10**.
     */
    boxMargin: 10,

    /**
     * margin around the text in loop/alt/opt boxes
     * **Default value 5**.
     */
    boxTextMargin: 5,

    /**
     * margin around notes.
     * **Default value 10**.
     */
    noteMargin: 10,

    /**
     * Space between messages.
     * **Default value 35**.
     */
    messageMargin: 35,

    /**
     * Multiline message alignment. Possible values are:
     *   * left
     *   * center **default**
     *   * right
     */
    messageAlign: 'center',

    /**
     * mirror actors under diagram.
     * **Default value true**.
     */
    mirrorActors: true,

    /**
     * Depending on css styling this might need adjustment.
     * Prolongs the edge of the diagram downwards.
     * **Default value 1**.
     */
    bottomMarginAdj: 1,

    /**
     * when this flag is set the height and width is set to 100% and is then scaling with the
     * available space if not the absolute space required is used.
     * **Default value true**.
     */
    useMaxWidth: true,

    /**
     * This will display arrows that start and begin at the same node as right angles, rather than a curve
     * **Default value false**.
     */
    rightAngles: false,
    /**
     * This will show the node numbers
     * **Default value false**.
     */
    showSequenceNumbers: false,
    /**
     * This sets the font size of the actor's description
     * **Default value 14**.
     */
    actorFontSize: 14,
    /**
     * This sets the font family of the actor's description
     * **Default value "Open-Sans", "sans-serif"**.
     */
    actorFontFamily: '"Open-Sans", "sans-serif"',
    /**
     * This sets the font weight of the actor's description
     * **Default value 400.
     */
    actorFontWeight: 400,
    /**
     * This sets the font size of actor-attached notes.
     * **Default value 14**.
     */
    noteFontSize: 14,
    /**
     * This sets the font family of actor-attached notes.
     * **Default value "trebuchet ms", verdana, arial**.
     */
    noteFontFamily: '"trebuchet ms", verdana, arial',
    /**
     * This sets the font weight of the note's description
     * **Default value 400.
     */
    noteFontWeight: 400,
    /**
     * This sets the text alignment of actor-attached notes.
     * **Default value center**.
     */
    noteAlign: 'center',
    /**
     * This sets the font size of actor messages.
     * **Default value 16**.
     */
    messageFontSize: 16,
    /**
     * This sets the font family of actor messages.
     * **Default value "trebuchet ms", verdana, arial**.
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
    messageFont: () => {
      const c = getConfig();
      return {
        fontFamily: c.messageFontFamily,
        fontSize: c.messageFontSize,
        fontWeight: c.messageFontWeight
      };
    },
    noteFont: () => {
      const c = getConfig();
      return {
        fontFamily: c.noteFontFamily,
        fontSize: c.noteFontSize,
        fontWeight: c.noteFontWeight
      };
    },
    actorFont: () => {
      const c = getConfig();
      return {
        fontFamily: c.actorFontFamily,
        fontSize: c.actorFontSize,
        fontWeight: c.actorFontWeight
      };
    }
  },

  /**
   * The object containing configurations specific for gantt diagrams*
   */
  gantt: {
    /**
     * Margin top for the text over the gantt diagram
     * **Default value 25**.
     */
    titleTopMargin: 25,

    /**
     * The height of the bars in the graph
     * **Default value 20**.
     */
    barHeight: 20,

    /**
     * The margin between the different activities in the gantt diagram.
     * **Default value 4**.
     */
    barGap: 4,

    /**
     *  Margin between title and gantt diagram and between axis and gantt diagram.
     * **Default value 50**.
     */
    topPadding: 50,

    /**
     *  The space allocated for the section name to the left of the activities.
     * **Default value 75**.
     */
    leftPadding: 75,

    /**
     *  Vertical starting position of the grid lines.
     * **Default value 35**.
     */
    gridLineStartPadding: 35,

    /**
     *  Font size ...
     * **Default value 11**.
     */
    fontSize: 11,

    /**
     * font family ...
     * **Default value '"Open-Sans", "sans-serif"'**.
     */
    fontFamily: '"Open-Sans", "sans-serif"',

    /**
     * The number of alternating section styles.
     * **Default value 4**.
     */
    numberSectionStyles: 4,

    /**
     * Datetime format of the axis. This might need adjustment to match your locale and preferences
     * **Default value '%Y-%m-%d'**.
     */
    axisFormat: '%Y-%m-%d'
  },
  /**
   * The object containing configurations specific for sequence diagrams
   */
  journey: {
    /**
     * margin to the right and left of the sequence diagram.
     * **Default value 50**.
     */
    diagramMarginX: 50,

    /**
     * margin to the over and under the sequence diagram.
     * **Default value 10**.
     */
    diagramMarginY: 10,

    /**
     * Margin between actors.
     * **Default value 50**.
     */
    actorMargin: 50,

    /**
     * Width of actor boxes
     * **Default value 150**.
     */
    width: 150,

    /**
     * Height of actor boxes
     * **Default value 65**.
     */
    height: 65,

    /**
     * Margin around loop boxes
     * **Default value 10**.
     */
    boxMargin: 10,

    /**
     * margin around the text in loop/alt/opt boxes
     * **Default value 5**.
     */
    boxTextMargin: 5,

    /**
     * margin around notes.
     * **Default value 10**.
     */
    noteMargin: 10,

    /**
     * Space between messages.
     * **Default value 35**.
     */
    messageMargin: 35,

    /**
     * Multiline message alignment. Possible values are:
     *   * left
     *   * center **default**
     *   * right
     */
    messageAlign: 'center',

    /**
     * Depending on css styling this might need adjustment.
     * Prolongs the edge of the diagram downwards.
     * **Default value 1**.
     */
    bottomMarginAdj: 1,

    /**
     * when this flag is set the height and width is set to 100% and is then scaling with the
     * available space if not the absolute space required is used.
     * **Default value true**.
     */
    useMaxWidth: true,

    /**
     * This will display arrows that start and begin at the same node as right angles, rather than a curve
     * **Default value false**.
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
     * The amount of padding around the diagram as a whole so that embedded diagrams have margins, expressed in pixels
     */
    diagramPadding: 20,

    /**
     * Directional bias for layout of entities. Can be either 'TB', 'BT', 'LR', or 'RL',
     * where T = top, B = bottom, L = left, and R = right.
     */
    layoutDirection: 'TB',

    /**
     * The mimimum width of an entity box, expressed in pixels
     */
    minEntityWidth: 100,

    /**
     * The minimum height of an entity box, expressed in pixels
     */
    minEntityHeight: 75,

    /**
     * The minimum internal padding between the text in an entity box and the enclosing box borders, expressed in pixels
     */
    entityPadding: 15,

    /**
     * Stroke color of box edges and lines
     */
    stroke: 'gray',

    /**
     * Fill color of entity boxes
     */
    fill: 'honeydew',

    /**
     * Font size (expressed as an integer representing a number of  pixels)
     */
    fontSize: 12
  }
};
config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
config.git.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
export const defaultConfig = Object.freeze(config);

const siteConfig = assignWithDepth({}, defaultConfig);
const currentConfig = assignWithDepth({}, defaultConfig);

/**
 * Sets the siteConfig. The siteConfig is a protected configuration for repeat use. Calls to reset() will reset
 * the currentConfig to siteConfig. Calls to reset(configApi.defaultConfig) will reset siteConfig and currentConfig
 * to the defaultConfig
 * Note: currentConfig is set in this function
 * @param conf - the base currentConfig to use as siteConfig
 * @returns {*} - the siteConfig
 */
export const setSiteConfig = conf => {
  assignWithDepth(currentConfig, conf, { clobber: true });
  assignWithDepth(siteConfig, conf);
  return getSiteConfig();
};
/**
 * Obtains the current siteConfig base configuration
 * @returns {*}
 */
export const getSiteConfig = () => {
  return assignWithDepth({}, siteConfig);
};
/**
 * Sets the currentConfig. The param conf is sanitized based on the siteConfig.secure keys. Any
 * values found in conf with key found in siteConfig.secure will be replaced with the corresponding
 * siteConfig value.
 * @param conf - the potential currentConfig
 * @returns {*} - the currentConfig merged with the sanitized conf
 */
export const setConfig = conf => {
  sanitize(conf);
  assignWithDepth(currentConfig, conf);
  return getConfig();
};
/**
 * Obtains the currentConfig
 * @returns {*} - the currentConfig
 */
export const getConfig = () => {
  return assignWithDepth({}, currentConfig);
};
/**
 * Ensures options parameter does not attempt to override siteConfig secure keys
 * Note: modifies options in-place
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
 * Resets this currentConfig to conf
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
