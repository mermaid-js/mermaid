import exp from 'constants';
import { shapes } from './nodes.js';

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
    expect(shapes.term).toBe(shapes.stadium);
  });

  // fr | subproc | framed-rectangle | subroutine
  it('should support alias for subroutine shape ', function () {
    expect(shapes['framed-rectangle']).toBe(shapes.fr);
    expect(shapes.subproc).toBe(shapes.fr);
    expect(shapes.subroutine).toBe(shapes.fr);
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
    expect(shapes['l-r']).toBe(shapes['lean-right']);
    expect(shapes['in-out']).toBe(shapes['lean-right']);
  });

  // l-l | lean-left | out-in
  it('should support alias for lean-left shape ', function () {
    expect(shapes['l-l']).toBe(shapes['lean-left']);
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

  // dc | double-circle
  it('should support alias for doublecircle shape ', function () {
    expect(shapes['double-circle']).toBe(shapes.dc);
  });

  // notched-rect | card | notch-rect
  it('should support alias for notched-rectangle shape ', function () {
    expect(shapes.card).toBe(shapes['notched-rect']);
    expect(shapes['notch-rect']).toBe(shapes['notched-rect']);
  });

  // lined-rect | lined-proc | shaded-proc
  it('should support alias for shadedProcess shape ', function () {
    expect(shapes['lined-proc']).toBe(shapes['lined-rect']);
    expect(shapes['shaded-proc']).toBe(shapes['lined-rect']);
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

  // fork | join | long-rect
  it('should support alias for fork shape ', function () {
    expect(shapes.join).toBe(shapes.fork);
    expect(shapes['long-rect']).toBe(shapes.fork);
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

  // we-rect | doc | wave-edge-rect | wave-edged-rectangle
  it('should support alias for waveEdgedRectangle shape ', function () {
    expect(shapes.doc).toBe(shapes['we-rect']);
    expect(shapes['wave-edge-rect']).toBe(shapes['we-rect']);
    expect(shapes['wave-edged-rectangle']).toBe(shapes['we-rect']);
  });

  // delay | half-rounded-rect
  it('should support alias for halfRoundedRectangle shape ', function () {
    expect(shapes.delay).toBe(shapes['half-rounded-rect']);
  });

  // t-cyl | das | titled-cylinder
  it('should support alias for tilted-cylinder shape ', function () {
    expect(shapes.das).toBe(shapes['t-cyl']);
    expect(shapes['tilted-cylinder']).toBe(shapes['t-cyl']);
  });

  // l-cyl | disk | lined-cylinder
  it('should support alias for linedCylinder shape ', function () {
    expect(shapes.disk).toBe(shapes['l-cyl']);
    expect(shapes['lined-cylinder']).toBe(shapes['l-cyl']);
  });

  // cur-trap | disp | display | curved-trapezoid
  it('should support alias for curvedTrapezoid shape ', function () {
    expect(shapes.disp).toBe(shapes['cur-trap']);
    expect(shapes['curved-trapezoid']).toBe(shapes['cur-trap']);
    expect(shapes.display).toBe(shapes['cur-trap']);
  });

  // div-rect | div-proc | divided-rectangle
  it('should support alias for dividedRectangle shape ', function () {
    expect(shapes['div-proc']).toBe(shapes['div-rect']);
    expect(shapes['divided-rectangle']).toBe(shapes['div-rect']);
  });

  // sm-tri | extract | small-triangle | triangle
  it('should support alias for smallTriangle shape ', function () {
    expect(shapes.extract).toBe(shapes['sm-tri']);
    expect(shapes['small-triangle']).toBe(shapes['sm-tri']);
    expect(shapes.triangle).toBe(shapes['sm-tri']);
  });

  // win-pane | internal-storage | window-pane
  it('should support alias for windowPane shape ', function () {
    expect(shapes['internal-storage']).toBe(shapes['win-pane']);
    expect(shapes['window-pane']).toBe(shapes['win-pane']);
  });

  // fc | junction | filled-circle
  it('should support alias for filledCircle shape ', function () {
    expect(shapes.junction).toBe(shapes.fc);
    expect(shapes['filled-circle']).toBe(shapes.fc);
  });

  //lin-we-rect | lin-doc | lined-wave-edged-rect
  it('should support alias for linedWaveEdgedRectangle shape ', function () {
    expect(shapes['lin-doc']).toBe(shapes['lin-we-rect']);
    expect(shapes['lined-wave-edged-rect']).toBe(shapes['lin-we-rect']);
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

  //sloped-rect | manual-input | sloped-rectangle
  it('should support alias for slopedRectangle shape ', function () {
    expect(shapes['manual-input']).toBe(shapes['sloped-rect']);
    expect(shapes['sloped-rectangle']).toBe(shapes['sloped-rect']);
  });

  // mul-we-rect | mul-doc | multi-wave-edged-rectangle
  it('should support alias for multiWaveEdgedRectangle shape ', function () {
    expect(shapes['mul-doc']).toBe(shapes['mul-we-rect']);
    expect(shapes['multi-wave-edged-rectangle']).toBe(shapes['mul-we-rect']);
  });

  // mul-rect | mul-proc | multi-rect
  it('should support alias for multiRect shape ', function () {
    expect(shapes['mul-proc']).toBe(shapes['mul-rect']);
    expect(shapes['multi-rect']).toBe(shapes['mul-rect']);
  });

  // flag | paper-tape
  it('should support alias for paperTape shape ', function () {
    expect(shapes['paper-tape']).toBe(shapes.flag);
  });

  // bt-rect| stored-data | bow-tie-rect
  it('should support alias for bowTieRect shape ', function () {
    expect(shapes['stored-data']).toBe(shapes['bt-rect']);
    expect(shapes['bow-tie-rect']).toBe(shapes['bt-rect']);
  });

  // cross-circle | summary | crossed-circle
  it('should support alias for crossedCircle shape ', function () {
    expect(shapes.summary).toBe(shapes['cross-circle']);
    expect(shapes['crossed-circle']).toBe(shapes['cross-circle']);
  });

  // tag-we-rect | tag-doc | tagged-wave-edged-rectangle
  it('should support alias for taggedWaveEdgedRectangle shape ', function () {
    expect(shapes['tag-doc']).toBe(shapes['tag-we-rect']);
    expect(shapes['tagged-wave-edged-rectangle']).toBe(shapes['tag-we-rect']);
  });

  // tag-rect | tag-proc | tagged-rect
  it('should support alias for taggedRect shape ', function () {
    expect(shapes['tag-proc']).toBe(shapes['tag-rect']);
    expect(shapes['tagged-rect']).toBe(shapes['tag-rect']);
  });
});
