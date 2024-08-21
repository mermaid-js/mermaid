import { setLogLevel } from '../../diagram-api/diagramAPI.js';
import * as commonDb from '../common/commonDb.js';
import { parser as timeline } from './parser/timeline.jison';
import * as timelineDB from './timelineDb.js';

describe('when parsing a timeline ', function () {
  beforeEach(function () {
    timeline.yy = timelineDB;
    timelineDB.clear();
    setLogLevel('trace');
  });
  describe('Timeline', function () {
    it('should handle a simple section definition abc-123', function () {
      let str = `timeline
    section abc-123`;

      timeline.parse(str);
      expect(timelineDB.getSections()).to.deep.equal(['abc-123']);
    });

    it('should handle a simple section and only two tasks', function () {
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

    it('should handle a two section and two coressponding tasks', function () {
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

    it('should handle a section, and task and its events', function () {
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

    it('should handle a section, and task and its multi line events', function () {
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

    it('should handle a title, section, task, and events with semicolons', function () {
      let str = `timeline
      title ;my;title;
      section ;a;bc-123;
      ;ta;sk1;: ;ev;ent1; : ;ev;ent2; : ;ev;ent3;
   `;
      timeline.parse(str);
      expect(commonDb.getDiagramTitle()).equal(';my;title;');
      expect(timelineDB.getSections()).to.deep.equal([';a;bc-123;']);
      expect(timelineDB.getTasks()[0].events).toMatchInlineSnapshot(`
        [
          ";ev;ent1; ",
          ";ev;ent2; ",
          ";ev;ent3;",
        ]
      `);
    });

    it('should handle a title, section, task, and events with hashtags', function () {
      let str = `timeline
      title #my#title#
      section #a#bc-123#
      task1: #ev#ent1# : #ev#ent2# : #ev#ent3#
   `;
      timeline.parse(str);
      expect(commonDb.getDiagramTitle()).equal('#my#title#');
      expect(timelineDB.getSections()).to.deep.equal(['#a#bc-123#']);
      expect(timelineDB.getTasks()[0].task).equal('task1');
      expect(timelineDB.getTasks()[0].events).toMatchInlineSnapshot(`
        [
          "#ev#ent1# ",
          "#ev#ent2# ",
          "#ev#ent3#",
        ]
      `);
    });
  });
});
