import timelineDb from './timelineDb.js';

describe('when using the timelineDb', function () {
  beforeEach(function () {
    timelineDb.clear();
  });

  it('should return each task once across repeated reads and additions', function () {
    timelineDb.addSection('Releases');
    timelineDb.addTask('2026', 0, 'Release');

    expect(timelineDb.getTasks()).toHaveLength(1);
    expect(timelineDb.getTasks()).toHaveLength(1);

    timelineDb.addTask('2027', 0, 'Next release');
    expect(timelineDb.getTasks().map((task) => task.task)).toEqual(['2026', '2027']);
    expect(timelineDb.getTasks()).toHaveLength(2);
  });

  it('should retain events added to a task after it has been read', function () {
    timelineDb.addTask('2026', 0, 'Release');
    const task = timelineDb.getTasks()[0];
    timelineDb.addEvent('Patch');
    expect(task.events).toEqual(['Release', 'Patch']);
    expect(timelineDb.getTasks()).toEqual([task]);

    timelineDb.addTask('2027', 0, 'Next release');
    timelineDb.addEvent('Next patch');
    expect(timelineDb.getTasks().map((task) => task.events)).toEqual([
      ['Release', 'Patch'],
      ['Next release', 'Next patch'],
    ]);
  });

  it('should preserve tasks added directly before and after a read', function () {
    timelineDb.addTaskOrg('First');
    timelineDb.addTask('2026', 0, 'Release');
    expect(timelineDb.getTasks()).toHaveLength(2);

    timelineDb.addTaskOrg('Last');
    expect(timelineDb.getTasks().map((task) => task.task)).toEqual(['First', '2026', 'Last']);
  });

  it('should include new tasks and events after clearing previously read tasks', function () {
    timelineDb.addTask('2025', 0, 'Old release');
    timelineDb.getTasks();
    timelineDb.clear();
    timelineDb.addSection('Releases');
    timelineDb.addTask('2026', 0, 'Release');
    timelineDb.addEvent('Patch');

    expect(timelineDb.getTasks().map((task) => task.task)).toEqual(['2026']);
    expect(timelineDb.getTasks()).toHaveLength(1);
    expect(timelineDb.getTasks()[0].events).toEqual(['Release', 'Patch']);
  });
});
