import { shapes } from './shapes.js';
import { describe, it, expect } from 'vitest';

describe('Test Alias for shapes', function () {
  // for each shape in docs/syntax/flowchart.md, along with its semantic name, short name, and alias name, add a test case
  // Process | rect | proc | rectangle
  it('should support alias for rectangle shape ', function () {
    expect(shapes.process).toBe(shapes.rect);
    expect(shapes.proc).toBe(shapes.rect);
    expect(shapes.rectangle).toBe(shapes.rect);
  });

  // event | rounded
  it('should support alias for rounded shape ', function () {
    expect(shapes.event).toBe(shapes.rounded);
  });

  // stadium | pill | term
  it('should support alias for stadium shape ', function () {
    expect(shapes.pill).toBe(shapes.stadium);
    expect(shapes.terminal).toBe(shapes.stadium);
  });

  // fr-rect | subproc | framed-rectangle | subroutine
  it('should support alias for subroutine shape ', function () {
    expect(shapes['framed-rectangle']).toBe(shapes['fr-rect']);
    expect(shapes.subproc).toBe(shapes['fr-rect']);
    expect(shapes.subroutine).toBe(shapes['fr-rect']);
  });

  // cyl | db | cylinder
  it('should support alias for cylinder shape ', function () {
    expect(shapes.db).toBe(shapes.cylinder);
    expect(shapes.cyl).toBe(shapes.cylinder);
  });

  // diam | decision | diamond
  it('should support alias for diamond shape ', function () {
    expect(shapes.diam).toBe(shapes.decision);
    expect(shapes.diamond).toBe(shapes.decision);
  });

  // hex | hexagon | prepare
  it('should support alias for hexagon shape ', function () {
    expect(shapes.hex).toBe(shapes.hexagon);
    expect(shapes.prepare).toBe(shapes.hexagon);
  });

  // l-r | lean-right | in-out
  it('should support alias for lean-right shape ', function () {
    expect(shapes['lean-r']).toBe(shapes['lean-right']);
    expect(shapes['in-out']).toBe(shapes['lean-right']);
  });

  // l-l | lean-left | out-in
  it('should support alias for lean-left shape ', function () {
    expect(shapes['lean-l']).toBe(shapes['lean-left']);
    expect(shapes['out-in']).toBe(shapes['lean-left']);
  });

  // trap-b | trapezoid-bottom | priority | trapezoid
  it('should support alias for trapezoid shape ', function () {
    expect(shapes['trapezoid-bottom']).toBe(shapes['trap-b']);
    expect(shapes.priority).toBe(shapes['trap-b']);
    expect(shapes.trapezoid).toBe(shapes['trap-b']);
  });

  // trap-t | trapezoid-top | manual | inv-trapezoid
  it('should support alias for inv_trapezoid shape ', function () {
    expect(shapes['trapezoid-top']).toBe(shapes['trap-t']);
    expect(shapes.manual).toBe(shapes['trap-t']);
    expect(shapes['inv-trapezoid']).toBe(shapes['trap-t']);
  });

  // dbl-circ| double-circle
  it('should support alias for doublecircle shape ', function () {
    expect(shapes['double-circle']).toBe(shapes['dbl-circ']);
  });

  // notched-rectangle | card | notch-rect
  it('should support alias for notched-rectangle shape ', function () {
    expect(shapes.card).toBe(shapes['notched-rectangle']);
    expect(shapes['notch-rect']).toBe(shapes['notched-rectangle']);
  });

  it('should support alias for shadedProcess shape ', function () {
    const aliases = ['lined-process', 'lined-rectangle', 'lin-proc', 'lin-rect'] as const;
    for (const alias of aliases) {
      expect(shapes[alias]).toBe(shapes['shaded-process']);
    }
  });

  // sm-circ | small-circle | start
  it('should support alias for smallCircle shape ', function () {
    expect(shapes['small-circle']).toBe(shapes['sm-circ']);
    expect(shapes.start).toBe(shapes['sm-circ']);
  });

  //  framed-circle | stop
  it('should support alias for framed circle shape ', function () {
    expect(shapes.stop).toBe(shapes['framed-circle']);
  });

  // fork | join
  it('should support alias for fork shape ', function () {
    expect(shapes.join).toBe(shapes.fork);
  });

  // brace | comment | brace-l
  it('should support alias for brace shape ', function () {
    expect(shapes.comment).toBe(shapes.brace);
    expect(shapes['brace-l']).toBe(shapes.brace);
  });

  // bolt | com-link | lightning-bolt
  it('should support alias for bolt shape ', function () {
    expect(shapes['com-link']).toBe(shapes.bolt);
    expect(shapes['lightning-bolt']).toBe(shapes.bolt);
  });

  // document | doc
  it('should support alias for waveEdgedRectangle shape ', function () {
    expect(shapes.doc).toBe(shapes.document);
  });

  // delay | half-rounded-rectangle
  it('should support alias for halfRoundedRectangle shape ', function () {
    expect(shapes.delay).toBe(shapes['half-rounded-rectangle']);
  });

  // h-cyl | das | horizontal-cylinder
  it('should support alias for horizontal-cylinder shape ', function () {
    expect(shapes.das).toBe(shapes['h-cyl']);
    expect(shapes['horizontal-cylinder']).toBe(shapes['h-cyl']);
  });

  // lin-cyl | disk | lined-cylinder
  it('should support alias for linedCylinder shape ', function () {
    expect(shapes.disk).toBe(shapes['lin-cyl']);
    expect(shapes['lined-cylinder']).toBe(shapes['lin-cyl']);
  });

  // curv-trap | display | curved-trapezoid
  it('should support alias for curvedTrapezoid shape ', function () {
    expect(shapes.display).toBe(shapes['curv-trap']);
    expect(shapes['curved-trapezoid']).toBe(shapes['curv-trap']);
  });

  // div-rect | div-proc | divided-rectangle
  it('should support alias for dividedRectangle shape ', function () {
    expect(shapes['div-proc']).toBe(shapes['div-rect']);
    expect(shapes['divided-rectangle']).toBe(shapes['div-rect']);
  });

  // sm-tri | extract | small-triangle | triangle
  it('should support alias for smallTriangle shape ', function () {
    expect(shapes.extract).toBe(shapes.tri);
    expect(shapes.triangle).toBe(shapes.tri);
  });

  // win-pane | internal-storage | window-pane
  it('should support alias for windowPane shape ', function () {
    expect(shapes['internal-storage']).toBe(shapes['win-pane']);
    expect(shapes['window-pane']).toBe(shapes['win-pane']);
  });

  // fc | junction | filled-circle
  it('should support alias for filledCircle shape ', function () {
    expect(shapes.junction).toBe(shapes['f-circ']);
    expect(shapes['filled-circle']).toBe(shapes['f-circ']);
  });

  // | lin-doc | lined-document
  it('should support alias for linedWaveEdgedRectangle shape ', function () {
    expect(shapes['lin-doc']).toBe(shapes['lined-document']);
  });

  // notch-pent | loop-limit | notched-pentagon
  it('should support alias for notchedPentagon shape ', function () {
    expect(shapes['loop-limit']).toBe(shapes['notch-pent']);
    expect(shapes['notched-pentagon']).toBe(shapes['notch-pent']);
  });

  // flip-tri | manual-file | flipped-triangle
  it('should support alias for flippedTriangle shape ', function () {
    expect(shapes['manual-file']).toBe(shapes['flip-tri']);
    expect(shapes['flipped-triangle']).toBe(shapes['flip-tri']);
  });

  //sl-rect | manual-input | sloped-rectangle
  it('should support alias for slopedRectangle shape ', function () {
    expect(shapes['manual-input']).toBe(shapes['sl-rect']);
    expect(shapes['sloped-rectangle']).toBe(shapes['sl-rect']);
  });

  // docs | documents | st-doc | stacked-document
  it('should support alias for multiWaveEdgedRectangle shape ', function () {
    expect(shapes.docs).toBe(shapes.documents);
    expect(shapes['st-doc']).toBe(shapes['stacked-document']);
  });

  // procs | processes | st-rect | stacked-rectangle
  it('should support alias for multiRect shape ', function () {
    expect(shapes.procs).toBe(shapes.processes);
    expect(shapes['st-rect']).toBe(shapes['stacked-rectangle']);
  });

  // flag | paper-tape
  it('should support alias for paperTape shape ', function () {
    expect(shapes['paper-tape']).toBe(shapes.flag);
  });

  // bow-rect| stored-data | bow-tie-rectangle
  it('should support alias for bowTieRect shape ', function () {
    expect(shapes['stored-data']).toBe(shapes['bow-rect']);
    expect(shapes['bow-tie-rectangle']).toBe(shapes['bow-rect']);
  });

  // cross-circ | summary | crossed-circle
  it('should support alias for crossedCircle shape ', function () {
    expect(shapes.summary).toBe(shapes['cross-circ']);
    expect(shapes['crossed-circle']).toBe(shapes['cross-circ']);
  });

  // tag-doc| tag-document
  it('should support alias for taggedDocument shape ', function () {
    expect(shapes['tag-doc']).toBe(shapes['tagged-document']);
  });

  // tag-rect | tag-proc | tagged-rectangle | tagged-process
  it('should support alias for taggedRect shape ', function () {
    expect(shapes['tag-proc']).toBe(shapes['tag-rect']);
    expect(shapes['tagged-rectangle']).toBe(shapes['tag-rect']);
    expect(shapes['tagged-process']).toBe(shapes['tag-rect']);
  });
});
