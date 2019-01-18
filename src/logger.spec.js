/* eslint-env jest */
import { LEVELS, logger, setLogLevel } from './logger'

// mock moment.format to return a consistent value
const mockTime = '00:00:00.00'
jest.mock('moment', () => () => ({ format: () => mockTime }))

const levelArray = Object.keys(LEVELS)
const minLevel = Math.min.apply(Math, Object.values(LEVELS))
const maxLevel = Math.max.apply(Math, Object.values(LEVELS))
const expectedColors = {
  debug: '\x1b[32m',
  info: '\x1b[34m',
  warn: `\x1b[33m`,
  error: '\x1b[31m',
  fatal: '\x1b[35m'
}

const expectAllLevelsToEqualFunctions = function () {
  // for each function in the logger object
  for (let i = 0; i < levelArray.length; i++) {
    // check that it's a function
    expect(typeof logger[levelArray[i]]).toEqual('function')
    // call the function and ensure it doesn't return anything
    expect(logger[levelArray[i]]()).toEqual(undefined)
  }
}

const testSetLogLevel = function (level) {
  // cap the level entered to the minimum and maximum levels
  const cappedLevel = Math.min(Math.max(level, minLevel), maxLevel + 1)
  const numberOfLevelFunctionsInitialized = levelArray.length - cappedLevel
  // set each function in the logger object to undefined
  for (let i = 0; i < levelArray.length; i++) {
    logger[levelArray[i]] = undefined
  }
  setLogLevel(level)
  expectAllLevelsToEqualFunctions()
  // expect(console.log.bind).toHaveBeenCalledTimes(numberOfLevelFunctionsInitialized + 1)
  for (let i = 1; i <= numberOfLevelFunctionsInitialized; i++) {
    const reverseIndex = levelArray.length - i
    // expect each function that is set to console.log.bind to have been
    expect(console.log.bind).toHaveBeenNthCalledWith(
      i,
      console,
      expectedColors[levelArray[reverseIndex]],
      `${mockTime} : ${levelArray[reverseIndex].toUpperCase()} : `
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

    // Create a test for each log level
    for (let i = 0; i < levelArray.length; i++) {
      // compile list of function names for the test description
      let functionNames = [ `.${levelArray[i]}()` ]
      for (let x = i + 1; x < levelArray.length; x++) {
        functionNames.push(`.${levelArray[i]}()`)
      }
      it(`${levelArray[i]}, should set ${functionNames.join(
        ', '
      )} to a mocked version of console.log.bind`, function () {
        testSetLogLevel(LEVELS[levelArray[i]])
      })
    }

    it('a value higher than the maximum level, should reinitialize all functions but not set any of the functions', function () {
      testSetLogLevel(Number.MAX_VALUE)
    })

    it('a value lower than the minimum level, should reinitialize all functions and set all of the functions', function () {
      testSetLogLevel(Number.MIN_VALUE)
    })
  })
})
