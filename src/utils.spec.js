/* eslint-env jasmine */
import utils from './utils'

describe('when detecting chart type ', function () {
  var str
  it('should handle a graph defintion', function () {
    str = 'graph TB\nbfs1:queue'

    var type = utils.detectType(str)
    expect(type).toBe('graph')
  })
  it('should handle a graph defintion with leading spaces', function () {
    str = '    graph TB\nbfs1:queue'

    var type = utils.detectType(str)
    expect(type).toBe('graph')
  })

  it('should handle a graph defintion with leading spaces and newline', function () {
    str = '  \n  graph TB\nbfs1:queue'

    var type = utils.detectType(str)
    expect(type).toBe('graph')
  })
  it('should handle a graph defintion for gitGraph', function () {
    str = '  \n  gitGraph TB:\nbfs1:queue'

    var type = utils.detectType(str)
    expect(type).toBe('gitGraph')
  })
})

describe('when finding substring in array ', function () {
  it('should return the array index that contains the substring', function () {
    var arr = ['stroke:val1', 'fill:val2']
    var result = utils.isSubstringInArray('fill', arr)
    expect(result).toEqual(1)
  })
  it('should return -1 if the substring is not found in the array', function () {
    var arr = ['stroke:val1', 'stroke-width:val2']
    var result = utils.isSubstringInArray('fill', arr)
    expect(result).toEqual(-1)
  })
})
