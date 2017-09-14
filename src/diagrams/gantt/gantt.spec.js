/* eslint-env jasmine */
import { parser } from './parser/gantt'
import ganttDb from './ganttDb'

describe('when parsing a gantt diagram it', function () {
  beforeEach(function () {
    parser.yy = ganttDb
  })

  it('should handle an dateFormat definition', function () {
    const str = 'gantt\ndateFormat yyyy-mm-dd'

    parser.parse(str)
  })
  it('should handle an dateFormat definition', function () {
    const str = 'gantt\ndateFormat yyyy-mm-dd\ntitle Adding gantt diagram functionality to mermaid'

    parser.parse(str)
  })
  it('should handle an dateFormat definition', function () {
    const str = 'gantt\ndateFormat yyyy-mm-dd\ntitle Adding gantt diagram functionality to mermaid'

    parser.parse(str)
  })
  it('should handle an section definition', function () {
    const str = 'gantt\ndateFormat yyyy-mm-dd\ntitle Adding gantt diagram functionality to mermaid'

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
      'dateFormat yyyy-mm-dd\n' +
      'title Adding gantt diagram functionality to mermaid\n' +
      'section Documentation\n' +
      'Design jison grammar:des1, 2014-01-01, 2014-01-04'

    parser.parse(str)
  })
})
