/* eslint-env jasmine */
import { parser } from './parser/gantt'
import ganttDb from './ganttDb'
import moment from 'moment'

describe('when parsing a gantt diagram it', function () {
  beforeEach(function () {
    parser.yy = ganttDb
    parser.yy.clear()
  })

  it('should handle a dateFormat definition', function () {
    const str = 'gantt\ndateFormat yyyy-mm-dd'

    parser.parse(str)
  })
  it('should handle a title definition', function () {
    const str = 'gantt\ndateFormat yyyy-mm-dd\ntitle Adding gantt diagram functionality to mermaid'

    parser.parse(str)
  })
  it('should handle a section definition', function () {
    const str = 'gantt\n' +
      'dateFormat yyyy-mm-dd\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'section Documentation'

    parser.parse(str)
  })
  /**
   * Beslutsflöde inligt nedan. Obs bla bla bla
   * ```
   * graph TD
   * A[Hard pledge] -- text on link -->B(Round edge)
   * B --> C{to do or not to do}
   * C -->|Too| D[Result one]
   * C -->|Doo| E[Result two]
   ```
   * params bapa - a unique bapap
   */
  it('should handle a task definition', function () {
    const str = 'gantt\n' +
      'dateFormat YYYY-MM-DD\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'section Documentation\n' +
      'Design jison grammar:des1, 2014-01-01, 2014-01-04'

    parser.parse(str)

    const tasks = parser.yy.getTasks()

    expect(tasks[0].startTime).toEqual(moment('2014-01-01', 'YYYY-MM-DD').toDate())
    expect(tasks[0].endTime).toEqual(moment('2014-01-04', 'YYYY-MM-DD').toDate())
    expect(tasks[0].id).toEqual('des1')
    expect(tasks[0].task).toEqual('Design jison grammar')
  })
  it('should handle a milestone task', function () {
    const str = 'gantt\n' +
      'dateFormat YYYY-MM-DD\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'section Documentation\n' +
      'test task:milestone, 2014-01-01, 2014-01-04'

    parser.parse(str)

    const tasks = parser.yy.getTasks()
    expect(tasks[0].milestone).toBeTruthy()
    expect(tasks[0].done).toBeFalsy()
    expect(tasks[0].crit).toBeFalsy()
    expect(tasks[0].active).toBeFalsy()
  })
  it('should handle a done task', function () {
    const str = 'gantt\n' +
      'dateFormat YYYY-MM-DD\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'section Documentation\n' +
      'test task:done, 2014-01-01, 2014-01-04'

    parser.parse(str)

    const tasks = parser.yy.getTasks()
    expect(tasks[0].milestone).toBeFalsy()
    expect(tasks[0].done).toBeTruthy()
    expect(tasks[0].crit).toBeFalsy()
    expect(tasks[0].active).toBeFalsy()
  })
  it('should handle a critical task', function () {
    const str = 'gantt\n' +
      'dateFormat YYYY-MM-DD\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'section Documentation\n' +
      'test task:crit, 2014-01-01, 2014-01-04'

    parser.parse(str)

    const tasks = parser.yy.getTasks()
    expect(tasks[0].milestone).toBeFalsy()
    expect(tasks[0].done).toBeFalsy()
    expect(tasks[0].crit).toBeTruthy()
    expect(tasks[0].active).toBeFalsy()
  })
  it('should handle an active task', function () {
    const str = 'gantt\n' +
      'dateFormat YYYY-MM-DD\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'section Documentation\n' +
      'test task:active, 2014-01-01, 2014-01-04'

    parser.parse(str)

    const tasks = parser.yy.getTasks()
    expect(tasks[0].milestone).toBeFalsy()
    expect(tasks[0].done).toBeFalsy()
    expect(tasks[0].crit).toBeFalsy()
    expect(tasks[0].active).toBeTruthy()
  })
  it('should handle task with multiple tags', function () {
    const str = 'gantt\n' +
      'dateFormat YYYY-MM-DD\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'section Documentation\n' +
      'test task:crit,milestone,done, 2014-01-01, 2014-01-04'

    parser.parse(str)

    const tasks = parser.yy.getTasks()
    expect(tasks[0].milestone).toBeTruthy()
    expect(tasks[0].done).toBeTruthy()
    expect(tasks[0].crit).toBeTruthy()
    expect(tasks[0].active).toBeFalsy()
  })
})
