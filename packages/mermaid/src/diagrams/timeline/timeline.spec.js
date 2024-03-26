import { parser as timeline } from './parser/timeline.jison';
import * as timelineDB from './timelineDb.js';
import { setLogLevel } from '../../diagram-api/diagramAPI.js';
import * as svgDraw from './svgDraw';
import { select } from 'd3';

describe('when parsing a timeline ', function () {
  // Some of the tests are using d3 drawing and node doesn't support getComputedTextLength or getBBox
  // because it isn't attached to a real DOM - so we need to mock them.
  const originalGetComputedTextLength = SVGElement.prototype.getComputedTextLength;
  const originalSVGGetBBox = SVGElement.prototype.getBBox;
  const originalHTMLGetBBox = HTMLUnknownElement.prototype.getBBox;

  beforeEach(function () {
    timeline.yy = timelineDB;
    timelineDB.clear();
    setLogLevel('trace');
    SVGElement.prototype.getComputedTextLength = () => {
      return 150;
    };

    SVGElement.prototype.getBBox = HTMLUnknownElement.prototype.getBBox = () => {
      return {
        x: 0,
        y: 0,
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
      };
    };
  });

  afterEach(function () {
    SVGElement.prototype.getComputedTextLength = originalGetComputedTextLength;
    SVGElement.prototype.getBBox = originalSVGGetBBox;
    HTMLUnknownElement.prototype.getBBox = originalHTMLGetBBox;
  });

  describe('Timeline', function () {
    it('TL-1 should handle a simple section definition abc-123', function () {
      let str = `timeline
    section abc-123`;

      timeline.parse(str);
      expect(timelineDB.getSections()).to.deep.equal(['abc-123']);
    });

    it('TL-2 should handle a simple section and only two tasks', function () {
      let str = `timeline
    section abc-123
    task1
    task2`;
      timeline.parse(str);
      timelineDB.getTasks().forEach((task) => {
        expect(task.section).to.equal('abc-123');
        expect(task.task).to.be.oneOf(['task1', 'task2']);
      });
    });

    it('TL-3 should handle a two section and two coressponding tasks', function () {
      let str = `timeline
    section abc-123
    task1
    task2
    section abc-456
    task3
    task4`;
      timeline.parse(str);
      expect(timelineDB.getSections()).to.deep.equal(['abc-123', 'abc-456']);
      timelineDB.getTasks().forEach((task) => {
        expect(task.section).to.be.oneOf(['abc-123', 'abc-456']);
        expect(task.task).to.be.oneOf(['task1', 'task2', 'task3', 'task4']);
        if (task.section === 'abc-123') {
          expect(task.task).to.be.oneOf(['task1', 'task2']);
        } else {
          expect(task.task).to.be.oneOf(['task3', 'task4']);
        }
      });
    });

    it('TL-4 should handle a section, and task and its events', function () {
      let str = `timeline
    section abc-123
      task1: event1
      task2: event2: event3
   `;
      timeline.parse(str);
      expect(timelineDB.getSections()[0]).to.deep.equal('abc-123');
      timelineDB.getTasks().forEach((t) => {
        switch (t.task.trim()) {
          case 'task1':
            expect(t.events).to.deep.equal(['event1']);
            break;

          case 'task2':
            expect(t.events).to.deep.equal(['event2', 'event3']);
            break;

          default:
            break;
        }
      });
    });

    it('TL-5 should handle a section, and task and its multi line events', function () {
      let str = `timeline
    section abc-123
      task1: event1
      task2: event2: event3
           : event4: event5
   `;
      timeline.parse(str);
      expect(timelineDB.getSections()[0]).to.deep.equal('abc-123');
      timelineDB.getTasks().forEach((t) => {
        switch (t.task.trim()) {
          case 'task1':
            expect(t.events).to.deep.equal(['event1']);
            break;

          case 'task2':
            expect(t.events).to.deep.equal(['event2', 'event3', 'event4', 'event5']);
            break;

          default:
            break;
        }
      });
    });
  });

  it('TL-6 should render markup as html if htmlLabel option is true', function () {
    // Assemble
    const element = select(document.createElement('div'), 'div');
    const conf = {
      timeline: {
        htmlLabels: true,
      },
    };

    // Act
    svgDraw.drawNode(
      element,
      {
        descr: '__this should be strong__',
      },
      1,
      conf
    );

    // Assert
    expect(element.html()).to.contain('<strong>this should be strong</strong>');
  });

  it('TL-6 should render markup as svg if htmlLabel option is false', function () {
    // Assemble
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const element = select(svg, 'svg');

    const conf = {
      timeline: {
        htmlLabels: false,
      },
    };

    // Act
    svgDraw.drawNode(
      element,
      {
        descr: '__this should be strong__',
      },
      1,
      conf
    );

    // Assert
    expect(element.html()).to.contain(
      '<tspan font-style="normal" class="text-inner-tspan" font-weight="bold"> strong</tspan>'
    );
  });

  it('TL-7 should render svg text elements to have correct styling if htmlLabel option is false', function () {
    // Assemble
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const element = select(svg, 'svg');

    const conf = {
      timeline: {
        htmlLabels: false,
      },
    };

    // Act
    svgDraw.drawNode(
      element,
      {
        descr: 'text',
      },
      1,
      conf
    );

    // Assert
    expect(element.node().outerHTML).to.contain(
      '<g dy="1em" alignment-baseline="middle" dominant-baseline="middle" text-anchor="middle" transform="translate('
    );
  });

  it('TL-8 should render a newline if a break element present', function () {
    // Assemble
    const element = select(document.createElement('div'), 'div');
    const conf = {
      timeline: {
        htmlLabels: true,
      },
    };

    // Act
    svgDraw.drawNode(
      element,
      {
        descr: 'a<br/>b',
      },
      1,
      conf
    );

    // Assert
    expect(element.html()).to.contain('a<br>b');
  });

  it('TL-9 should render a newline if a none closing break element is present', function () {
    // Assemble
    const element = select(document.createElement('div'), 'div');
    const conf = {
      timeline: {
        htmlLabels: true,
      },
    };

    // Act
    svgDraw.drawNode(
      element,
      {
        descr: 'a<br>b',
      },
      1,
      conf
    );

    // Assert
    expect(element.html()).to.contain('a<br>b');
  });

  it('TL-10 should render a newline if a break element is present with spaces', function () {
    // Assemble
    const element = select(document.createElement('div'), 'div');
    const conf = {
      timeline: {
        htmlLabels: true,
      },
    };

    // Act
    svgDraw.drawNode(
      element,
      {
        descr: 'a<br >b',
      },
      1,
      conf
    );

    // Assert
    expect(element.html()).to.contain('a<br>b');
  });

  it('TL-11 should not render a newline if a break element has anything other than spaces', function () {
    // Assemble
    const element = select(document.createElement('div'), 'div');
    const conf = {
      timeline: {
        htmlLabels: true,
      },
    };

    // Act
    svgDraw.drawNode(
      element,
      {
        descr: 'a<bring>b',
      },
      1,
      conf
    );

    // Assert
    expect(element.html()).to.not.contain('a<br>b');
  });
});
