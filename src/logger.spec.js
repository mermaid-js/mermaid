/* eslint-env jest */
import { LEVELS, logger, setLogLevel } from './logger'

// mock moment.format to return a consistent value
const mockTime = '00:00:00.00'
jest.mock('moment', () => () => ({ format: () => mockTime }))

const levelNames = Object.keys(LEVELS)

const expectedColors = {
  debug: '\x1b[32m',
  info: '\x1b[34m',
  warn: `\x1b[33m`,
  error: '\x1b[31m',
  fatal: '\x1b[35m'
}

// A function to test that the logger object contains a function for each level
// and that when calling that function it returns a value of undefined
const expectAllLevelsToEqualFunctions = function () {
  // for each function in the logger object
  for (let i = 0; i < levelNames.length; i++) {
    // check that it's a function
    expect(typeof logger[levelNames[i]]).toEqual('function')
    // call the function and ensure it doesn't return anything
    expect(logger[levelNames[i]]()).toEqual(undefined)
  }
}

// A function for testing the setLogLevel function.
// it will:
// - set each function in logger to undefined
// - call setLogLevel
// - test that each function in logger is set to atleast an empty function.
// - test that only the functions with the log level and above are set by
//   check if the mocked console.log.bind function was called.
const testSetLogLevel = function (level) {
  const levelValues = Object.values(LEVELS)
  const minLevel = Math.min.apply(Math, levelValues)
  const maxLevel = Math.max.apply(Math, levelValues)
  // cap the level entered to the minimum and maximum levels
  const cappedLevel = Math.min(Math.max(level, minLevel), maxLevel + 1)
  const numberOfLevelFunctionsInitialized = levelNames.length - cappedLevel

  // set each function in the logger object to undefined
  for (let i = 0; i < levelNames.length; i++) {
    logger[levelNames[i]] = undefined
  }
  setLogLevel(level)
  expectAllLevelsToEqualFunctions()
  // check that mocked versions of console.log.bind was called for the proper functions
  for (let i = 1; i <= numberOfLevelFunctionsInitialized; i++) {
    const reverseIndex = levelNames.length - i
    // expect each function that is set to console.log.bind to have been
    expect(console.log.bind).toHaveBeenNthCalledWith(
      i,
      console,
      expectedColors[levelNames[reverseIndex]],
      `${mockTime} : ${levelNames[reverseIndex].toUpperCase()} : `
    )
  }
}

describe('when using logger', function () {
  it('upon import, should have an object with a function for each level', function () {
    expectAllLevelsToEqualFunctions()
  })

  describe('when setting log level to', function () {
    const originalConsoleLogBind = console.log.bind
    beforeAll(function () {
      // mock console.log.bind()
      console.log.bind = jest.fn().mockReturnValue(() => undefined)
    })
    afterAll(function () {
      // cleanup console.log.bind mocking by setting back to it's original value
      console.log.bind = originalConsoleLogBind
    })
    beforeEach(function () {
      // clear the toHAveBeenNthCalledWith data on the mocked console.log.bind
      console.log.bind.mockClear()
    })

    it.each(levelNames)('%s, should set funcs >= to a mocked version of console.log.bind', function (level) {
      testSetLogLevel(LEVELS[level])
    })

    it('a value higher than the maximum level, should reinitialize all functions but not set any of the functions', function () {
      testSetLogLevel(Number.MAX_VALUE)
    })

    it('a value lower than the minimum level, should reinitialize all functions and set all of the functions', function () {
      testSetLogLevel(Number.MIN_VALUE)
    })
  })
})
