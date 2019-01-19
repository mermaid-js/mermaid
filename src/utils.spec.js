/* eslint-env jasmine */
import utils from './utils'

describe('when detecting chart type ', function () {
  it('should handle a graph defintion', function () {
    const str = 'graph TB\nbfs1:queue'
    const type = utils.detectType(str)
    expect(type).toBe('flowchart')
  })
  it('should handle a graph defintion with leading spaces', function () {
    const str = '    graph TB\nbfs1:queue'
    const type = utils.detectType(str)
    expect(type).toBe('flowchart')
  })

  it('should handle a graph defintion with leading spaces and newline', function () {
    const str = '  \n  graph TB\nbfs1:queue'
    const type = utils.detectType(str)
    expect(type).toBe('flowchart')
  })
  it('should handle a graph defintion for gitGraph', function () {
    const str = '  \n  gitGraph TB:\nbfs1:queue'
    const type = utils.detectType(str)
    expect(type).toBe('git')
  })
  it('should handle a sequenceDiagram defintion for gitGraph', function () {
    const str = 'sequenceDiagram TB:\nbfs1:queue'
    const type = utils.detectType(str)
    expect(type).toBe('sequence')
  })
  it('should handle a classDiagram defintion for gitGraph', function () {
    const str = 'classDiagram TB:\nbfs1:queue'
    const type = utils.detectType(str)
    expect(type).toBe('class')
  })
  it('should handle a gantt defintion for gitGraph', function () {
    const str = 'gantt TB:\nbfs1:queue'
    const type = utils.detectType(str)
    expect(type).toBe('gantt')
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

describe('when converting an interpolate to a curve', function () {
  const defaultCurve = 'linear'
  it('should return the defualt curve because the interpolate is falsy', function () {
    const result = utils.interpolateToCurve('', defaultCurve)
    expect(result).toEqual('linear')
  })
  it('should return the d3 curve name, because the interpolate is found in d3', function () {
    const result = utils.interpolateToCurve('basis', undefined)
    expect(result).toEqual('basis')
  })
  it('should return the default curve name because the interpolate is not in d3[]', function () {
    const result = utils.interpolateToCurve('curveUnknown', defaultCurve)
    expect(result).toEqual(defaultCurve)
  })
})
