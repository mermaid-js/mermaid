import { parser } from './parser/example'
import exampleDb from './exampleDb'

/* eslint-env jasmine */
describe('when parsing an info graph it', function () {
  beforeEach(function () {
    parser.yy = exampleDb
  })

  it('should handle an info definition', function () {
    const str = 'info\nsay: hello'
    parser.parse(str)
  })
  it('should handle an showMessage statement definition', function () {
    const str = 'info\nshowInfo'
    parser.parse(str)
  })
})
