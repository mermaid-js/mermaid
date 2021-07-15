/* eslint-env jasmine */
import moment from 'moment-mini';
import ganttDb from './ganttDb';

describe('when using the ganttDb', function() {
  beforeEach(function() {
    ganttDb.clear();
  });

  describe('when using relative times', function() {
    it.each`
      diff     | date                    | expected
      ${' 1d'} | ${moment('2019-01-01')} | ${moment('2019-01-02').toDate()}
      ${' 1w'} | ${moment('2019-01-01')} | ${moment('2019-01-08').toDate()}
    `('should add $diff to $date resulting in $expected', ({ diff, date, expected }) => {
      expect(ganttDb.durationToDate(diff, date)).toEqual(expected);
    });
  });

  describe('when calling the clear function', function() {
    beforeEach(function() {
      ganttDb.setDateFormat('YYYY-MM-DD');
      ganttDb.enableInclusiveEndDates();
      ganttDb.setTodayMarker('off');
      ganttDb.setExcludes('weekends 2019-02-06,friday');
      ganttDb.addSection('weekends skip test');
      ganttDb.addTask('test1', 'id1,2019-02-01,1d');
      ganttDb.addTask('test2', 'id2,after id1,2d');
      ganttDb.clear();
    });

    it.each`
      fn                        | expected
      ${'getTasks'}             | ${[]}
      ${'getTitle'}             | ${''}
      ${'getDateFormat'}        | ${''}
      ${'getAxisFormat'}        | ${''}
      ${'getTodayMarker'}       | ${''}
      ${'getExcludes'}          | ${[]}
      ${'getSections'}          | ${[]}
      ${'endDatesAreInclusive'} | ${false}
    `('should clear $fn', ({ fn, expected }) => {
      expect(ganttDb[fn]()).toEqual(expected);
    });
  });

  it.each`
    testName                                                                             | section     | taskName   | taskData                       | expStartDate            | expEndDate                       | expId      | expTask
    ${'should handle fixed dates'}                                                       | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2013-01-12'} | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 12)}         | ${'id1'}   | ${'test1'}
    ${'should handle duration (days) instead of fixed date to determine end date'}       | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2d'}         | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 3)}          | ${'id1'}   | ${'test1'}
    ${'should handle duration (hours) instead of fixed date to determine end date'}      | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2h'}         | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 1, 2)}       | ${'id1'}   | ${'test1'}
    ${'should handle duration (minutes) instead of fixed date to determine end date'}    | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2m'}         | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 1, 0, 2)}    | ${'id1'}   | ${'test1'}
    ${'should handle duration (seconds) instead of fixed date to determine end date'}    | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2s'}         | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 1, 0, 0, 2)} | ${'id1'}   | ${'test1'}
    ${'should handle duration (weeks) instead of fixed date to determine end date'}      | ${'testa1'} | ${'test1'} | ${'id1,2013-01-01,2w'}         | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 15)}         | ${'id1'}   | ${'test1'}
    ${'should handle fixed dates without id'}                                            | ${'testa1'} | ${'test1'} | ${'2013-01-01,2013-01-12'}     | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 12)}         | ${'task1'} | ${'test1'}
    ${'should handle duration instead of a fixed date to determine end date without id'} | ${'testa1'} | ${'test1'} | ${'2013-01-01,4d'}             | ${new Date(2013, 0, 1)} | ${new Date(2013, 0, 5)}          | ${'task1'} | ${'test1'}
  `('$testName', ({ section, taskName, taskData, expStartDate, expEndDate, expId, expTask }) => {
    ganttDb.setDateFormat('YYYY-MM-DD');
    ganttDb.addSection(section);
    ganttDb.addTask(taskName, taskData);
    const tasks = ganttDb.getTasks();
    expect(tasks[0].startTime).toEqual(expStartDate);
    expect(tasks[0].endTime).toEqual(expEndDate);
    expect(tasks[0].id).toEqual(expId);
    expect(tasks[0].task).toEqual(expTask);
  });

  it.each`
    section     | taskName1  | taskName2  | taskData1              | taskData2             | expStartDate2                                | expEndDate2              | expId2     | expTask2
    ${'testa1'} | ${'test1'} | ${'test2'} | ${'id1,2013-01-01,2w'} | ${'id2,after id1,1d'} | ${new Date(2013, 0, 15)}                     | ${undefined}             | ${'id2'}   | ${'test2'}
    ${'testa1'} | ${'test1'} | ${'test2'} | ${'id1,2013-01-01,2w'} | ${'id2,after id3,1d'} | ${new Date(new Date().setHours(0, 0, 0, 0))} | ${undefined}             | ${'id2'}   | ${'test2'}
    ${'testa1'} | ${'test1'} | ${'test2'} | ${'id1,2013-01-01,2w'} | ${'after id1,1d'}     | ${new Date(2013, 0, 15)}                     | ${undefined}             | ${'task1'} | ${'test2'}
    ${'testa1'} | ${'test1'} | ${'test2'} | ${'id1,2013-01-01,2w'} | ${'2013-01-26'}       | ${new Date(2013, 0, 15)}                     | ${new Date(2013, 0, 26)} | ${'task1'} | ${'test2'}
    ${'testa1'} | ${'test1'} | ${'test2'} | ${'id1,2013-01-01,2w'} | ${'2d'}               | ${new Date(2013, 0, 15)}                     | ${new Date(2013, 0, 17)} | ${'task1'} | ${'test2'}
  `(
    '$testName',
    ({
      section,
      taskName1,
      taskName2,
      taskData1,
      taskData2,
      expStartDate2,
      expEndDate2,
      expId2,
      expTask2
    }) => {
      ganttDb.setDateFormat('YYYY-MM-DD');
      ganttDb.addSection(section);
      ganttDb.addTask(taskName1, taskData1);
      ganttDb.addTask(taskName2, taskData2);
      const tasks = ganttDb.getTasks();
      expect(tasks[1].startTime).toEqual(expStartDate2);
      if (!expEndDate2 === undefined) {
        expect(tasks[1].endTime).toEqual(expEndDate2);
      }
      expect(tasks[1].id).toEqual(expId2);
      expect(tasks[1].task).toEqual(expTask2);
    }
  );

  it('should handle relative start date based on id regardless of sections', function() {
    ganttDb.setDateFormat('YYYY-MM-DD');
    ganttDb.addSection('testa1');
    ganttDb.addTask('test1', 'id1,2013-01-01,2w');
    ganttDb.addTask('test2', 'id2,after id3,1d');
    ganttDb.addSection('testa2');
    ganttDb.addTask('test3', 'id3,after id1,2d');

    const tasks = ganttDb.getTasks();

    expect(tasks[1].startTime).toEqual(new Date(2013, 0, 17));
    expect(tasks[1].endTime).toEqual(new Date(2013, 0, 18));
    expect(tasks[1].id).toEqual('id2');
    expect(tasks[1].task).toEqual('test2');

    expect(tasks[2].id).toEqual('id3');
    expect(tasks[2].task).toEqual('test3');
    expect(tasks[2].startTime).toEqual(new Date(2013, 0, 15));
    expect(tasks[2].endTime).toEqual(new Date(2013, 0, 17));
  });
  it('should ignore weekends', function() {
    ganttDb.setDateFormat('YYYY-MM-DD');
    ganttDb.setExcludes('weekends 2019-02-06,friday');
    ganttDb.addSection('weekends skip test');
    ganttDb.addTask('test1', 'id1,2019-02-01,1d');
    ganttDb.addTask('test2', 'id2,after id1,2d');
    ganttDb.addTask('test3', 'id3,after id2,7d');
    ganttDb.addTask('test4', 'id4,2019-02-01,2019-02-20'); // Fixed endTime
    ganttDb.addTask('test5', 'id5,after id4,1d');
    ganttDb.addSection('full ending taks on last day');
    ganttDb.addTask('test6', 'id6,2019-02-13,2d');
    ganttDb.addTask('test7', 'id7,after id6,1d');

    const tasks = ganttDb.getTasks();

    expect(tasks[0].startTime).toEqual(moment('2019-02-01', 'YYYY-MM-DD').toDate());
    expect(tasks[0].endTime).toEqual(moment('2019-02-04', 'YYYY-MM-DD').toDate());
    expect(tasks[0].renderEndTime).toEqual(moment('2019-02-02', 'YYYY-MM-DD').toDate());
    expect(tasks[0].id).toEqual('id1');
    expect(tasks[0].task).toEqual('test1');

    expect(tasks[1].startTime).toEqual(moment('2019-02-04', 'YYYY-MM-DD').toDate());
    expect(tasks[1].endTime).toEqual(moment('2019-02-07', 'YYYY-MM-DD').toDate());
    expect(tasks[1].renderEndTime).toEqual(moment('2019-02-06', 'YYYY-MM-DD').toDate());
    expect(tasks[1].id).toEqual('id2');
    expect(tasks[1].task).toEqual('test2');

    expect(tasks[2].startTime).toEqual(moment('2019-02-07', 'YYYY-MM-DD').toDate());
    expect(tasks[2].endTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate());
    expect(tasks[2].renderEndTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate());
    expect(tasks[2].id).toEqual('id3');
    expect(tasks[2].task).toEqual('test3');

    expect(tasks[3].startTime).toEqual(moment('2019-02-01', 'YYYY-MM-DD').toDate());
    expect(tasks[3].endTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate());
    expect(tasks[3].renderEndTime).toBeNull(); // Fixed end
    expect(tasks[3].id).toEqual('id4');
    expect(tasks[3].task).toEqual('test4');

    expect(tasks[4].startTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate());
    expect(tasks[4].endTime).toEqual(moment('2019-02-21', 'YYYY-MM-DD').toDate());
    expect(tasks[4].renderEndTime).toEqual(moment('2019-02-21', 'YYYY-MM-DD').toDate());
    expect(tasks[4].id).toEqual('id5');
    expect(tasks[4].task).toEqual('test5');

    expect(tasks[5].startTime).toEqual(moment('2019-02-13', 'YYYY-MM-DD').toDate());
    expect(tasks[5].endTime).toEqual(moment('2019-02-18', 'YYYY-MM-DD').toDate());
    expect(tasks[5].renderEndTime).toEqual(moment('2019-02-15', 'YYYY-MM-DD').toDate());
    expect(tasks[5].id).toEqual('id6');
    expect(tasks[5].task).toEqual('test6');

    expect(tasks[6].startTime).toEqual(moment('2019-02-18', 'YYYY-MM-DD').toDate());
    expect(tasks[6].endTime).toEqual(moment('2019-02-19', 'YYYY-MM-DD').toDate());
    expect(tasks[6].id).toEqual('id7');
    expect(tasks[6].task).toEqual('test7');
  });

  it('should maintain the order in which tasks are created', function() {
    ganttDb.setTitle('Project Execution');
    ganttDb.setDateFormat('YYYY-MM-DD');
    ganttDb.addSection('section A section');
    ganttDb.addTask('Completed task', 'done,    des1, 2014-01-06,2014-01-08');
    ganttDb.addTask('Active task', 'active,  des2, 2014-01-09, 3d');
    ganttDb.addTask('Future task', 'des3, after des2, 5d');
    ganttDb.addTask('Future task2', 'des4, after des3, 5d');

    ganttDb.addSection('section Critical tasks');
    ganttDb.addTask('Completed task in the critical line', 'crit, done, 2014-01-06,24h');
    ganttDb.addTask('Implement parser and jison', 'crit, done, after des1, 2d');
    ganttDb.addTask('Create tests for parser', 'crit, active, 3d');
    ganttDb.addTask('Future task in critical line', 'crit, 5d');
    ganttDb.addTask('Create tests for renderer', '2d');
    ganttDb.addTask('Add to mermaid', '1d');

    ganttDb.addSection('section Documentation');
    ganttDb.addTask('Describe gantt syntax', 'active, a1, after des1, 3d');
    ganttDb.addTask('Add gantt diagram to demo page', 'after a1  , 20h');
    ganttDb.addTask('Add another diagram to demo page', 'doc1, after a1  , 48h');

    ganttDb.addSection('section Last section');
    ganttDb.addTask('Describe gantt syntax', 'after doc1, 3d');
    ganttDb.addTask('Add gantt diagram to demo page', '20h');
    ganttDb.addTask('Add another diagram to demo page', '48h');

    const tasks = ganttDb.getTasks();

    // Section - A section
    expect(tasks[0].startTime).toEqual(moment('2014-01-06', 'YYYY-MM-DD').toDate());
    expect(tasks[0].endTime).toEqual(moment('2014-01-08', 'YYYY-MM-DD').toDate());
    expect(tasks[0].order).toEqual(0);
    expect(tasks[0].id).toEqual('des1');
    expect(tasks[0].task).toEqual('Completed task');

    expect(tasks[1].startTime).toEqual(moment('2014-01-09', 'YYYY-MM-DD').toDate());
    expect(tasks[1].endTime).toEqual(moment('2014-01-12', 'YYYY-MM-DD').toDate());
    expect(tasks[1].order).toEqual(1);
    expect(tasks[1].id).toEqual('des2');
    expect(tasks[1].task).toEqual('Active task');

    expect(tasks[2].startTime).toEqual(moment('2014-01-12', 'YYYY-MM-DD').toDate());
    expect(tasks[2].endTime).toEqual(moment('2014-01-17', 'YYYY-MM-DD').toDate());
    expect(tasks[2].order).toEqual(2);
    expect(tasks[2].id).toEqual('des3');
    expect(tasks[2].task).toEqual('Future task');

    expect(tasks[3].startTime).toEqual(moment('2014-01-17', 'YYYY-MM-DD').toDate());
    expect(tasks[3].endTime).toEqual(moment('2014-01-22', 'YYYY-MM-DD').toDate());
    expect(tasks[3].order).toEqual(3);
    expect(tasks[3].id).toEqual('des4');
    expect(tasks[3].task).toEqual('Future task2');

    // Section - Critical tasks
    expect(tasks[4].startTime).toEqual(moment('2014-01-06', 'YYYY-MM-DD').toDate());
    expect(tasks[4].endTime).toEqual(moment('2014-01-07', 'YYYY-MM-DD').toDate());
    expect(tasks[4].order).toEqual(4);
    expect(tasks[4].id).toEqual('task1');
    expect(tasks[4].task).toEqual('Completed task in the critical line');

    expect(tasks[5].startTime).toEqual(moment('2014-01-08', 'YYYY-MM-DD').toDate());
    expect(tasks[5].endTime).toEqual(moment('2014-01-10', 'YYYY-MM-DD').toDate());
    expect(tasks[5].order).toEqual(5);
    expect(tasks[5].id).toEqual('task2');
    expect(tasks[5].task).toEqual('Implement parser and jison');

    expect(tasks[6].startTime).toEqual(moment('2014-01-10', 'YYYY-MM-DD').toDate());
    expect(tasks[6].endTime).toEqual(moment('2014-01-13', 'YYYY-MM-DD').toDate());
    expect(tasks[6].order).toEqual(6);
    expect(tasks[6].id).toEqual('task3');
    expect(tasks[6].task).toEqual('Create tests for parser');

    expect(tasks[7].startTime).toEqual(moment('2014-01-13', 'YYYY-MM-DD').toDate());
    expect(tasks[7].endTime).toEqual(moment('2014-01-18', 'YYYY-MM-DD').toDate());
    expect(tasks[7].order).toEqual(7);
    expect(tasks[7].id).toEqual('task4');
    expect(tasks[7].task).toEqual('Future task in critical line');

    expect(tasks[8].startTime).toEqual(moment('2014-01-18', 'YYYY-MM-DD').toDate());
    expect(tasks[8].endTime).toEqual(moment('2014-01-20', 'YYYY-MM-DD').toDate());
    expect(tasks[8].order).toEqual(8);
    expect(tasks[8].id).toEqual('task5');
    expect(tasks[8].task).toEqual('Create tests for renderer');

    expect(tasks[9].startTime).toEqual(moment('2014-01-20', 'YYYY-MM-DD').toDate());
    expect(tasks[9].endTime).toEqual(moment('2014-01-21', 'YYYY-MM-DD').toDate());
    expect(tasks[9].order).toEqual(9);
    expect(tasks[9].id).toEqual('task6');
    expect(tasks[9].task).toEqual('Add to mermaid');

    // Section - Documentation
    expect(tasks[10].startTime).toEqual(moment('2014-01-08', 'YYYY-MM-DD').toDate());
    expect(tasks[10].endTime).toEqual(moment('2014-01-11', 'YYYY-MM-DD').toDate());
    expect(tasks[10].order).toEqual(10);
    expect(tasks[10].id).toEqual('a1');
    expect(tasks[10].task).toEqual('Describe gantt syntax');

    expect(tasks[11].startTime).toEqual(moment('2014-01-11', 'YYYY-MM-DD').toDate());
    expect(tasks[11].endTime).toEqual(moment('2014-01-11 20:00:00', 'YYYY-MM-DD HH:mm:ss').toDate());
    expect(tasks[11].order).toEqual(11);
    expect(tasks[11].id).toEqual('task7');
    expect(tasks[11].task).toEqual('Add gantt diagram to demo page');

    expect(tasks[12].startTime).toEqual(moment('2014-01-11', 'YYYY-MM-DD').toDate());
    expect(tasks[12].endTime).toEqual(moment('2014-01-13', 'YYYY-MM-DD').toDate());
    expect(tasks[12].order).toEqual(12);
    expect(tasks[12].id).toEqual('doc1');
    expect(tasks[12].task).toEqual('Add another diagram to demo page');

    // Section - Last section
    expect(tasks[13].startTime).toEqual(moment('2014-01-13', 'YYYY-MM-DD').toDate());
    expect(tasks[13].endTime).toEqual(moment('2014-01-16', 'YYYY-MM-DD').toDate());
    expect(tasks[13].order).toEqual(13);
    expect(tasks[13].id).toEqual('task8');
    expect(tasks[13].task).toEqual('Describe gantt syntax');

    expect(tasks[14].startTime).toEqual(moment('2014-01-16', 'YYYY-MM-DD').toDate());
    expect(tasks[14].endTime).toEqual(moment('2014-01-16 20:00:00', 'YYYY-MM-DD HH:mm:ss').toDate());
    expect(tasks[14].order).toEqual(14);
    expect(tasks[14].id).toEqual('task9');
    expect(tasks[14].task).toEqual('Add gantt diagram to demo page');

    expect(tasks[15].startTime).toEqual(moment('2014-01-16 20:00:00', 'YYYY-MM-DD HH:mm:ss').toDate());
    expect(tasks[15].endTime).toEqual(moment('2014-01-18 20:00:00', 'YYYY-MM-DD HH:mm:ss').toDate());
    expect(tasks[15].order).toEqual(15);
    expect(tasks[15].id).toEqual('task10');
    expect(tasks[15].task).toEqual('Add another diagram to demo page');
  });


  it('should work when end date is the 31st', function() {
    ganttDb.setDateFormat('YYYY-MM-DD');
    ganttDb.addSection('Task endTime is on the 31st day of the month');
    ganttDb.addTask('test1', 'id1,2019-09-30,11d');
    ganttDb.addTask('test2', 'id2,after id1,20d');
    const tasks = ganttDb.getTasks();

    expect(tasks[0].startTime).toEqual(moment('2019-09-30', 'YYYY-MM-DD').toDate());
    expect(tasks[0].endTime).toEqual(moment('2019-10-11', 'YYYY-MM-DD').toDate());
    expect(tasks[1].renderEndTime).toBeNull(); // Fixed end
    expect(tasks[0].id).toEqual('id1');
    expect(tasks[0].task).toEqual('test1');

    expect(tasks[1].startTime).toEqual(moment('2019-10-11', 'YYYY-MM-DD').toDate());
    expect(tasks[1].endTime).toEqual(moment('2019-10-31', 'YYYY-MM-DD').toDate());
    expect(tasks[1].renderEndTime).toBeNull(); // Fixed end
    expect(tasks[1].id).toEqual('id2');
    expect(tasks[1].task).toEqual('test2');
  });

  describe('when setting inclusive end dates', function() {
    beforeEach(function() {
      ganttDb.setDateFormat('YYYY-MM-DD');
      ganttDb.enableInclusiveEndDates();
      ganttDb.addTask('test1', 'id1,2019-02-01,1d');
      ganttDb.addTask('test2', 'id2,2019-02-01,2019-02-03');
    });
    it('should automatically add one day to all end dates', function() {
      const tasks = ganttDb.getTasks();
      expect(tasks[0].startTime).toEqual(moment('2019-02-01', 'YYYY-MM-DD').toDate());
      expect(tasks[0].endTime).toEqual(moment('2019-02-02', 'YYYY-MM-DD').toDate());
      expect(tasks[0].id).toEqual('id1');
      expect(tasks[0].task).toEqual('test1');

      expect(tasks[1].startTime).toEqual(moment('2019-02-01', 'YYYY-MM-DD').toDate());
      expect(tasks[1].endTime).toEqual(moment('2019-02-04', 'YYYY-MM-DD').toDate());
      expect(tasks[1].renderEndTime).toBeNull(); // Fixed end
      expect(tasks[1].manualEndTime).toBeTruthy();
      expect(tasks[1].id).toEqual('id2');
      expect(tasks[1].task).toEqual('test2');
    });
  });

  it.each`
    type       | expected
    ${'hide'}  | ${'off'}
    ${'style'} | ${'stoke:stroke-width:5px,stroke:#00f,opacity:0.5'}
  `('should ${type} today marker', ({ expected }) => {
    ganttDb.setTodayMarker(expected);
    expect(ganttDb.getTodayMarker()).toEqual(expected);
  });
});
