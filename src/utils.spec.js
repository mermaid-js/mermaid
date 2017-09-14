/* eslint-env jasmine */
import utils from './utils'

describe('when detecting chart type ', function () {
  it('should handle a graph defintion', function () {
    const str = 'graph TB\nbfs1:queue'
    const type = utils.detectType(str)
    expect(type).toBe('graph')
  })
  it('should handle a graph defintion with leading spaces', function () {
    const str = '    graph TB\nbfs1:queue'
    const type = utils.detectType(str)
    expect(type).toBe('graph')
  })

  it('should handle a graph defintion with leading spaces and newline', function () {
    const str = '  \n  graph TB\nbfs1:queue'
    const type = utils.detectType(str)
    expect(type).toBe('graph')
  })
  it('should handle a graph defintion for gitGraph', function () {
    const str = '  \n  gitGraph TB:\nbfs1:queue'
    const type = utils.detectType(str)
    expect(type).toBe('gitGraph')
  })
})

describe('when finding substring in array ', function () {
  it('should return the array index that contains the substring', function () {
    const arr = ['stroke:val1', 'fill:val2']
    const result = utils.isSubstringInArray('fill', arr)
    expect(result).toEqual(1)
  })
  it('should return -1 if the substring is not found in the array', function () {
    const arr = ['stroke:val1', 'stroke-width:val2']
    const result = utils.isSubstringInArray('fill', arr)
    expect(result).toEqual(-1)
  })
})
