import type { Entries } from 'type-fest';
import type { D3Selection, MaybePromise } from '../../types.js';
import type { Node, ShapeRenderOptions } from '../types.js';
import { anchor } from './shapes/anchor.js';
import { bowTieRect } from './shapes/bowTieRect.js';
import { card } from './shapes/card.js';
import { choice } from './shapes/choice.js';
import { circle } from './shapes/circle.js';
import { crossedCircle } from './shapes/crossedCircle.js';
import { curlyBraceLeft } from './shapes/curlyBraceLeft.js';
import { curlyBraceRight } from './shapes/curlyBraceRight.js';
import { curlyBraces } from './shapes/curlyBraces.js';
import { curvedTrapezoid } from './shapes/curvedTrapezoid.js';
import { cylinder } from './shapes/cylinder.js';
import { dividedRectangle } from './shapes/dividedRect.js';
import { doublecircle } from './shapes/doubleCircle.js';
import { filledCircle } from './shapes/filledCircle.js';
import { flippedTriangle } from './shapes/flippedTriangle.js';
import { forkJoin } from './shapes/forkJoin.js';
import { halfRoundedRectangle } from './shapes/halfRoundedRectangle.js';
import { hexagon } from './shapes/hexagon.js';
import { hourglass } from './shapes/hourglass.js';
import { icon } from './shapes/icon.js';
import { iconCircle } from './shapes/iconCircle.js';
import { iconRounded } from './shapes/iconRounded.js';
import { iconSquare } from './shapes/iconSquare.js';
import { imageSquare } from './shapes/imageSquare.js';
import { inv_trapezoid } from './shapes/invertedTrapezoid.js';
import { labelRect } from './shapes/labelRect.js';
import { lean_left } from './shapes/leanLeft.js';
import { lean_right } from './shapes/leanRight.js';
import { lightningBolt } from './shapes/lightningBolt.js';
import { linedCylinder } from './shapes/linedCylinder.js';
import { linedWaveEdgedRect } from './shapes/linedWaveEdgedRect.js';
import { multiRect } from './shapes/multiRect.js';
import { multiWaveEdgedRectangle } from './shapes/multiWaveEdgedRectangle.js';
import { note } from './shapes/note.js';
import { question } from './shapes/question.js';
import { rect_left_inv_arrow } from './shapes/rectLeftInvArrow.js';
import { rectWithTitle } from './shapes/rectWithTitle.js';
import { roundedRect } from './shapes/roundedRect.js';
import { shadedProcess } from './shapes/shadedProcess.js';
import { slopedRect } from './shapes/slopedRect.js';
import { squareRect } from './shapes/squareRect.js';
import { stadium } from './shapes/stadium.js';
import { state } from './shapes/state.js';
import { stateEnd } from './shapes/stateEnd.js';
import { stateStart } from './shapes/stateStart.js';
import { subroutine } from './shapes/subroutine.js';
import { taggedRect } from './shapes/taggedRect.js';
import { taggedWaveEdgedRectangle } from './shapes/taggedWaveEdgedRectangle.js';
import { text } from './shapes/text.js';
import { tiltedCylinder } from './shapes/tiltedCylinder.js';
import { trapezoid } from './shapes/trapezoid.js';
import { trapezoidalPentagon } from './shapes/trapezoidalPentagon.js';
import { triangle } from './shapes/triangle.js';
import { waveEdgedRectangle } from './shapes/waveEdgedRectangle.js';
import { waveRectangle } from './shapes/waveRectangle.js';
import { windowPane } from './shapes/windowPane.js';
import { classBox } from './shapes/classBox.js';
import { kanbanItem } from './shapes/kanbanItem.js';

type ShapeHandler = <T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  options: ShapeRenderOptions
) => MaybePromise<D3Selection<SVGGElement>>;

export interface ShapeDefinition {
  semanticName: string;
  name: string;
  shortName: string;
  description: string;
  /**
   * Aliases can include descriptive names, other short names, etc.
   */
  aliases?: string[];
  /**
   * These are names used by mermaid before the introduction of new shapes. These will not be in standard formats, and shouldn't be used by the users
   */
  internalAliases?: string[];
  handler: ShapeHandler;
}

export const shapesDefs = [
  {
    semanticName: 'Process',
    name: 'Rectangle',
    shortName: 'rect',
    description: 'Standard process shape',
    aliases: ['proc', 'process', 'rectangle'],
    internalAliases: ['squareRect'],
    handler: squareRect,
  },
  {
    semanticName: 'Event',
    name: 'Rounded Rectangle',
    shortName: 'rounded',
    description: 'Represents an event',
    aliases: ['event'],
    internalAliases: ['roundedRect'],
    handler: roundedRect,
  },
  {
    semanticName: 'Terminal Point',
    name: 'Stadium',
    shortName: 'stadium',
    description: 'Terminal point',
    aliases: ['terminal', 'pill'],
    handler: stadium,
  },
  {
    semanticName: 'Subprocess',
    name: 'Framed Rectangle',
    shortName: 'fr-rect',
    description: 'Subprocess',
    aliases: ['subprocess', 'subproc', 'framed-rectangle', 'subroutine'],
    handler: subroutine,
  },
  {
    semanticName: 'Database',
    name: 'Cylinder',
    shortName: 'cyl',
    description: 'Database storage',
    aliases: ['db', 'database', 'cylinder'],
    handler: cylinder,
  },
  {
    semanticName: 'Start',
    name: 'Circle',
    shortName: 'circle',
    description: 'Starting point',
    aliases: ['circ'],
    handler: circle,
  },
  {
    semanticName: 'Decision',
    name: 'Diamond',
    shortName: 'diam',
    description: 'Decision-making step',
    aliases: ['decision', 'diamond', 'question'],
    handler: question,
  },
  {
    semanticName: 'Prepare Conditional',
    name: 'Hexagon',
    shortName: 'hex',
    description: 'Preparation or condition step',
    aliases: ['hexagon', 'prepare'],
    handler: hexagon,
  },
  {
    semanticName: 'Data Input/Output',
    name: 'Lean Right',
    shortName: 'lean-r',
    description: 'Represents input or output',
    aliases: ['lean-right', 'in-out'],
    internalAliases: ['lean_right'],
    handler: lean_right,
  },
  {
    semanticName: 'Data Input/Output',
    name: 'Lean Left',
    shortName: 'lean-l',
    description: 'Represents output or input',
    aliases: ['lean-left', 'out-in'],
    internalAliases: ['lean_left'],
    handler: lean_left,
  },
  {
    semanticName: 'Priority Action',
    name: 'Trapezoid Base Bottom',
    shortName: 'trap-b',
    description: 'Priority action',
    aliases: ['priority', 'trapezoid-bottom', 'trapezoid'],
    handler: trapezoid,
  },
  {
    semanticName: 'Manual Operation',
    name: 'Trapezoid Base Top',
    shortName: 'trap-t',
    description: 'Represents a manual task',
    aliases: ['manual', 'trapezoid-top', 'inv-trapezoid'],
    internalAliases: ['inv_trapezoid'],
    handler: inv_trapezoid,
  },
  {
    semanticName: 'Stop',
    name: 'Double Circle',
    shortName: 'dbl-circ',
    description: 'Represents a stop point',
    aliases: ['double-circle'],
    internalAliases: ['doublecircle'],
    handler: doublecircle,
  },
  {
    semanticName: 'Text Block',
    name: 'Text Block',
    shortName: 'text',
    description: 'Text block',
    handler: text,
  },
  {
    semanticName: 'Card',
    name: 'Notched Rectangle',
    shortName: 'notch-rect',
    description: 'Represents a card',
    aliases: ['card', 'notched-rectangle'],
    handler: card,
  },
  {
    semanticName: 'Lined/Shaded Process',
    name: 'Lined Rectangle',
    shortName: 'lin-rect',
    description: 'Lined process shape',
    aliases: ['lined-rectangle', 'lined-process', 'lin-proc', 'shaded-process'],
    handler: shadedProcess,
  },
  {
    semanticName: 'Start',
    name: 'Small Circle',
    shortName: 'sm-circ',
    description: 'Small starting point',
    aliases: ['start', 'small-circle'],
    internalAliases: ['stateStart'],
    handler: stateStart,
  },
  {
    semanticName: 'Stop',
    name: 'Framed Circle',
    shortName: 'fr-circ',
    description: 'Stop point',
    aliases: ['stop', 'framed-circle'],
    internalAliases: ['stateEnd'],
    handler: stateEnd,
  },
  {
    semanticName: 'Fork/Join',
    name: 'Filled Rectangle',
    shortName: 'fork',
    description: 'Fork or join in process flow',
    aliases: ['join'],
    internalAliases: ['forkJoin'],
    handler: forkJoin,
  },
  {
    semanticName: 'Collate',
    name: 'Hourglass',
    shortName: 'hourglass',
    description: 'Represents a collate operation',
    aliases: ['hourglass', 'collate'],
    handler: hourglass,
  },
  {
    semanticName: 'Comment',
    name: 'Curly Brace',
    shortName: 'brace',
    description: 'Adds a comment',
    aliases: ['comment', 'brace-l'],
    handler: curlyBraceLeft,
  },
  {
    semanticName: 'Comment Right',
    name: 'Curly Brace',
    shortName: 'brace-r',
    description: 'Adds a comment',
    handler: curlyBraceRight,
  },
  {
    semanticName: 'Comment with braces on both sides',
    name: 'Curly Braces',
    shortName: 'braces',
    description: 'Adds a comment',
    handler: curlyBraces,
  },
  {
    semanticName: 'Com Link',
    name: 'Lightning Bolt',
    shortName: 'bolt',
    description: 'Communication link',
    aliases: ['com-link', 'lightning-bolt'],
    handler: lightningBolt,
  },
  {
    semanticName: 'Document',
    name: 'Document',
    shortName: 'doc',
    description: 'Represents a document',
    aliases: ['doc', 'document'],
    handler: waveEdgedRectangle,
  },
  {
    semanticName: 'Delay',
    name: 'Half-Rounded Rectangle',
    shortName: 'delay',
    description: 'Represents a delay',
    aliases: ['half-rounded-rectangle'],
    handler: halfRoundedRectangle,
  },
  {
    semanticName: 'Direct Access Storage',
    name: 'Horizontal Cylinder',
    shortName: 'h-cyl',
    description: 'Direct access storage',
    aliases: ['das', 'horizontal-cylinder'],
    handler: tiltedCylinder,
  },
  {
    semanticName: 'Disk Storage',
    name: 'Lined Cylinder',
    shortName: 'lin-cyl',
    description: 'Disk storage',
    aliases: ['disk', 'lined-cylinder'],
    handler: linedCylinder,
  },
  {
    semanticName: 'Display',
    name: 'Curved Trapezoid',
    shortName: 'curv-trap',
    description: 'Represents a display',
    aliases: ['curved-trapezoid', 'display'],
    handler: curvedTrapezoid,
  },
  {
    semanticName: 'Divided Process',
    name: 'Divided Rectangle',
    shortName: 'div-rect',
    description: 'Divided process shape',
    aliases: ['div-proc', 'divided-rectangle', 'divided-process'],
    handler: dividedRectangle,
  },
  {
    semanticName: 'Extract',
    name: 'Triangle',
    shortName: 'tri',
    description: 'Extraction process',
    aliases: ['extract', 'triangle'],
    handler: triangle,
  },
  {
    semanticName: 'Internal Storage',
    name: 'Window Pane',
    shortName: 'win-pane',
    description: 'Internal storage',
    aliases: ['internal-storage', 'window-pane'],
    handler: windowPane,
  },
  {
    semanticName: 'Junction',
    name: 'Filled Circle',
    shortName: 'f-circ',
    description: 'Junction point',
    aliases: ['junction', 'filled-circle'],
    handler: filledCircle,
  },
  {
    semanticName: 'Loop Limit',
    name: 'Trapezoidal Pentagon',
    shortName: 'notch-pent',
    description: 'Loop limit step',
    aliases: ['loop-limit', 'notched-pentagon'],
    handler: trapezoidalPentagon,
  },
  {
    semanticName: 'Manual File',
    name: 'Flipped Triangle',
    shortName: 'flip-tri',
    description: 'Manual file operation',
    aliases: ['manual-file', 'flipped-triangle'],
    handler: flippedTriangle,
  },
  {
    semanticName: 'Manual Input',
    name: 'Sloped Rectangle',
    shortName: 'sl-rect',
    description: 'Manual input step',
    aliases: ['manual-input', 'sloped-rectangle'],
    handler: slopedRect,
  },
  {
    semanticName: 'Multi-Document',
    name: 'Stacked Document',
    shortName: 'docs',
    description: 'Multiple documents',
    aliases: ['documents', 'st-doc', 'stacked-document'],
    handler: multiWaveEdgedRectangle,
  },
  {
    semanticName: 'Multi-Process',
    name: 'Stacked Rectangle',
    shortName: 'st-rect',
    description: 'Multiple processes',
    aliases: ['procs', 'processes', 'stacked-rectangle'],
    handler: multiRect,
  },
  {
    semanticName: 'Stored Data',
    name: 'Bow Tie Rectangle',
    shortName: 'bow-rect',
    description: 'Stored data',
    aliases: ['stored-data', 'bow-tie-rectangle'],
    handler: bowTieRect,
  },
  {
    semanticName: 'Summary',
    name: 'Crossed Circle',
    shortName: 'cross-circ',
    description: 'Summary',
    aliases: ['summary', 'crossed-circle'],
    handler: crossedCircle,
  },
  {
    semanticName: 'Tagged Document',
    name: 'Tagged Document',
    shortName: 'tag-doc',
    description: 'Tagged document',
    aliases: ['tag-doc', 'tagged-document'],
    handler: taggedWaveEdgedRectangle,
  },
  {
    semanticName: 'Tagged Process',
    name: 'Tagged Rectangle',
    shortName: 'tag-rect',
    description: 'Tagged process',
    aliases: ['tagged-rectangle', 'tag-proc', 'tagged-process'],
    handler: taggedRect,
  },
  {
    semanticName: 'Paper Tape',
    name: 'Flag',
    shortName: 'flag',
    description: 'Paper tape',
    aliases: ['paper-tape'],
    handler: waveRectangle,
  },
  {
    semanticName: 'Odd',
    name: 'Odd',
    shortName: 'odd',
    description: 'Odd shape',
    internalAliases: ['rect_left_inv_arrow'],
    handler: rect_left_inv_arrow,
  },
  {
    semanticName: 'Lined Document',
    name: 'Lined Document',
    shortName: 'lin-doc',
    description: 'Lined document',
    aliases: ['lined-document'],
    handler: linedWaveEdgedRect,
  },
] as const satisfies ShapeDefinition[];

const generateShapeMap = () => {
  // These are the shapes that didn't have documentation present
  const undocumentedShapes = {
    // States
    state,
    choice,
    note,

    // Rectangles
    rectWithTitle,
    labelRect,

    // Icons
    iconSquare,
    iconCircle,
    icon,
    iconRounded,
    imageSquare,
    anchor,

    // Kanban diagram
    kanbanItem,

    // class diagram
    classBox,
  } as const;

  const entries = [
    ...(Object.entries(undocumentedShapes) as Entries<typeof undocumentedShapes>),
    ...shapesDefs.flatMap((shape) => {
      const aliases = [
        shape.shortName,
        ...('aliases' in shape ? shape.aliases : []),
        ...('internalAliases' in shape ? shape.internalAliases : []),
      ];
      return aliases.map((alias) => [alias, shape.handler] as const);
    }),
  ];
  return Object.fromEntries(entries) as Record<
    (typeof entries)[number][0],
    (typeof entries)[number][1]
  > satisfies Record<string, ShapeHandler>;
};

export const shapes = generateShapeMap();

export function isValidShape(shape: string): shape is ShapeID {
  return shape in shapes;
}

export type ShapeID = keyof typeof shapes;
