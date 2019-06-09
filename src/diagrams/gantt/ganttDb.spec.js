/* eslint-env jasmine */
import moment from 'moment-mini'
import ganttDb from './ganttDb'

describe('when using the ganttDb', function () {
  beforeEach(function () {
    ganttDb.clear()
  })

  it('should handle an fixed dates', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2013-01-12')
    const tasks = ganttDb.getTasks()
    expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate())
    expect(tasks[0].endTime).toEqual(moment('2013-01-12', 'YYYY-MM-DD').toDate())
    expect(tasks[0].id).toEqual('id1')
    expect(tasks[0].task).toEqual('test1')
  })
  it('should handle duration (days) instead of fixed date to determine end date', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2d')
    const tasks = ganttDb.getTasks()
    expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate())
    expect(tasks[0].endTime).toEqual(moment('2013-01-03', 'YYYY-MM-DD').toDate())
    expect(tasks[0].id).toEqual('id1')
    expect(tasks[0].task).toEqual('test1')
  })
  it('should handle duration (hours) instead of fixed date to determine end date', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2h')
    const tasks = ganttDb.getTasks()
    expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate())
    expect(tasks[0].endTime).toEqual(moment('2013-01-01 2:00', 'YYYY-MM-DD hh:mm').toDate())
    expect(tasks[0].id).toEqual('id1')
    expect(tasks[0].task).toEqual('test1')
  })
  it('should handle duration (minutes) instead of fixed date to determine end date', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2m')
    const tasks = ganttDb.getTasks()
    expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate())
    expect(tasks[0].endTime).toEqual(moment('2013-01-01 00:02', 'YYYY-MM-DD hh:mm').toDate())
    expect(tasks[0].id).toEqual('id1')
    expect(tasks[0].task).toEqual('test1')
  })
  it('should handle duration (seconds) instead of fixed date to determine end date', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2s')
    const tasks = ganttDb.getTasks()
    expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate())
    expect(tasks[0].endTime).toEqual(moment('2013-01-01 00:00:02', 'YYYY-MM-DD hh:mm:ss').toDate())
    expect(tasks[0].id).toEqual('id1')
    expect(tasks[0].task).toEqual('test1')
  })
  it('should handle duration (weeks) instead of fixed date to determine end date', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2w')
    const tasks = ganttDb.getTasks()
    expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate())
    expect(tasks[0].endTime).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate())
    expect(tasks[0].id).toEqual('id1')
    expect(tasks[0].task).toEqual('test1')
  })

  it('should handle relative start date based on id', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2w')
    ganttDb.addTask('test2', 'id2,after id1,1d')

    const tasks = ganttDb.getTasks()

    expect(tasks[1].startTime).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate())
    expect(tasks[1].id).toEqual('id2')
    expect(tasks[1].task).toEqual('test2')
  })

  it('should handle relative start date based on id when id is invalid', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2w')
    ganttDb.addTask('test2', 'id2,after id3,1d')
    const tasks = ganttDb.getTasks()
    expect(tasks[1].startTime).toEqual(new Date((new Date()).setHours(0, 0, 0, 0)))
    expect(tasks[1].id).toEqual('id2')
    expect(tasks[1].task).toEqual('test2')
  })

  it('should handle fixed dates without id', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', '2013-01-01,2013-01-12')
    const tasks = ganttDb.getTasks()
    expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate())
    expect(tasks[0].endTime).toEqual(moment('2013-01-12', 'YYYY-MM-DD').toDate())
    expect(tasks[0].id).toEqual('task1')
    expect(tasks[0].task).toEqual('test1')
  })

  it('should handle duration instead of a fixed date to determine end date without id', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', '2013-01-01,4d')
    const tasks = ganttDb.getTasks()
    expect(tasks[0].startTime).toEqual(moment('2013-01-01', 'YYYY-MM-DD').toDate())
    expect(tasks[0].endTime).toEqual(moment('2013-01-05', 'YYYY-MM-DD').toDate())
    expect(tasks[0].id).toEqual('task1')
    expect(tasks[0].task).toEqual('test1')
  })

  it('should handle relative start date of a fixed date to determine end date without id', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2w')
    ganttDb.addTask('test2', 'after id1,1d')

    const tasks = ganttDb.getTasks()

    expect(tasks[1].startTime).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate())
    expect(tasks[1].id).toEqual('task1')
    expect(tasks[1].task).toEqual('test2')
  })
  it('should handle a new task with only an end date as definition', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2w')
    ganttDb.addTask('test2', '2013-01-26')

    const tasks = ganttDb.getTasks()

    expect(tasks[1].startTime).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate())
    expect(tasks[1].endTime).toEqual(moment('2013-01-26', 'YYYY-MM-DD').toDate())
    expect(tasks[1].id).toEqual('task1')
    expect(tasks[1].task).toEqual('test2')
  })
  it('should handle a new task with only an end date as definition', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2w')
    ganttDb.addTask('test2', '2d')

    const tasks = ganttDb.getTasks()

    expect(tasks[1].startTime).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate())
    expect(tasks[1].endTime).toEqual(moment('2013-01-17', 'YYYY-MM-DD').toDate())
    expect(tasks[1].id).toEqual('task1')
    expect(tasks[1].task).toEqual('test2')
  })
  it('should handle relative start date based on id regardless of sections', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.addSection('testa1')
    ganttDb.addTask('test1', 'id1,2013-01-01,2w')
    ganttDb.addTask('test2', 'id2,after id3,1d')
    ganttDb.addSection('testa2')
    ganttDb.addTask('test3', 'id3,after id1,2d')

    const tasks = ganttDb.getTasks()

    expect(tasks[1].startTime).toEqual(moment('2013-01-17', 'YYYY-MM-DD').toDate())
    expect(tasks[1].endTime).toEqual(moment('2013-01-18', 'YYYY-MM-DD').toDate())
    expect(tasks[1].id).toEqual('id2')
    expect(tasks[1].task).toEqual('test2')

    expect(tasks[2].id).toEqual('id3')
    expect(tasks[2].task).toEqual('test3')
    expect(tasks[2].startTime).toEqual(moment('2013-01-15', 'YYYY-MM-DD').toDate())
    expect(tasks[2].endTime).toEqual(moment('2013-01-17', 'YYYY-MM-DD').toDate())
  })
  it('should ignore weekends', function () {
    ganttDb.setDateFormat('YYYY-MM-DD')
    ganttDb.setExcludes('weekends 2019-02-06,friday')
    ganttDb.addSection('weekends skip test')
    ganttDb.addTask('test1', 'id1,2019-02-01,1d')
    ganttDb.addTask('test2', 'id2,after id1,2d')
    ganttDb.addTask('test3', 'id3,after id2,7d')
    ganttDb.addTask('test4', 'id4,2019-02-01,2019-02-20') // Fixed endTime
    ganttDb.addTask('test5', 'id5,after id4,1d')
    ganttDb.addSection('full ending taks on last day')
    ganttDb.addTask('test6', 'id6,2019-02-13,2d')
    ganttDb.addTask('test7', 'id7,after id6,1d')

    const tasks = ganttDb.getTasks()

    expect(tasks[0].startTime).toEqual(moment('2019-02-01', 'YYYY-MM-DD').toDate())
    expect(tasks[0].endTime).toEqual(moment('2019-02-04', 'YYYY-MM-DD').toDate())
    expect(tasks[0].renderEndTime).toEqual(moment('2019-02-02', 'YYYY-MM-DD').toDate())
    expect(tasks[0].id).toEqual('id1')
    expect(tasks[0].task).toEqual('test1')

    expect(tasks[1].startTime).toEqual(moment('2019-02-04', 'YYYY-MM-DD').toDate())
    expect(tasks[1].endTime).toEqual(moment('2019-02-07', 'YYYY-MM-DD').toDate())
    expect(tasks[1].renderEndTime).toEqual(moment('2019-02-06', 'YYYY-MM-DD').toDate())
    expect(tasks[1].id).toEqual('id2')
    expect(tasks[1].task).toEqual('test2')

    expect(tasks[2].startTime).toEqual(moment('2019-02-07', 'YYYY-MM-DD').toDate())
    expect(tasks[2].endTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate())
    expect(tasks[2].renderEndTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate())
    expect(tasks[2].id).toEqual('id3')
    expect(tasks[2].task).toEqual('test3')

    expect(tasks[3].startTime).toEqual(moment('2019-02-01', 'YYYY-MM-DD').toDate())
    expect(tasks[3].endTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate())
    expect(tasks[3].renderEndTime).toBeNull() // Fixed end
    expect(tasks[3].id).toEqual('id4')
    expect(tasks[3].task).toEqual('test4')

    expect(tasks[4].startTime).toEqual(moment('2019-02-20', 'YYYY-MM-DD').toDate())
    expect(tasks[4].endTime).toEqual(moment('2019-02-21', 'YYYY-MM-DD').toDate())
    expect(tasks[4].renderEndTime).toEqual(moment('2019-02-21', 'YYYY-MM-DD').toDate())
    expect(tasks[4].id).toEqual('id5')
    expect(tasks[4].task).toEqual('test5')

    expect(tasks[5].startTime).toEqual(moment('2019-02-13', 'YYYY-MM-DD').toDate())
    expect(tasks[5].endTime).toEqual(moment('2019-02-18', 'YYYY-MM-DD').toDate())
    expect(tasks[5].renderEndTime).toEqual(moment('2019-02-15', 'YYYY-MM-DD').toDate())
    expect(tasks[5].id).toEqual('id6')
    expect(tasks[5].task).toEqual('test6')

    expect(tasks[6].startTime).toEqual(moment('2019-02-18', 'YYYY-MM-DD').toDate())
    expect(tasks[6].endTime).toEqual(moment('2019-02-19', 'YYYY-MM-DD').toDate())
    expect(tasks[6].id).toEqual('id7')
    expect(tasks[6].task).toEqual('test7')
  })
})
