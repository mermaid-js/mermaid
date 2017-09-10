/* eslint-env jest */
/* eslint-env jasmine */
import cli from '../lib/cli'

beforeEach(() => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 64000
})

test('parses multiple files', function (done) {
  expect.assertions(3)

  const argv = ['example/file1.mermaid', 'file2.mermaid', 'file3.mermaid']
  const expected = ['example/file1.mermaid', 'file2.mermaid', 'file3.mermaid']

  cli.parse(argv, function (err, msg, opt) {
    expect(!err).toBeTruthy()
    expect(opt.files.length).toBe(3)
    expect(opt.files).toEqual(expected)

    done()
  })
})

test('defaults to png', function (done) {
  expect.assertions(3)

  const argv = ['example/file1.mermaid']

  cli.parse(argv, function (err, msg, opt) {
    expect(!err).toBeTruthy()
    expect(opt.png).toBeTruthy()
    expect(opt.svg).toBeFalsy()

    done()
  })
})

test('setting svg unsets png', function (done) {
  expect.assertions(3)

  const argv = ['example/file1.mermaid', '-s']

  cli.parse(argv, function (err, msg, opt) {
    expect(!err).toBeTruthy()
    expect(opt.svg).toBeTruthy()
    expect(opt.png).toBeFalsy()

    done()
  })
})

test('setting png and svg is allowed', function (done) {
  expect.assertions(3)

  const argv = ['example/file1.mermaid', '-s', '-p']

  cli.parse(argv, function (err, msg, opt) {
    expect(!err).toBeTruthy()
    expect(opt.png).toBeTruthy()
    expect(opt.svg).toBeTruthy()

    done()
  })
})

test('setting an output directory succeeds', function (done) {
  expect.assertions(2)

  const argv = ['example/file1.mermaid', '-o', 'example/']

  cli.parse(argv, function (err, msg, opt) {
    expect(!err).toBeTruthy()
    expect(opt.outputDir).toBe('example/')
    done()
  })
})

test('not setting a css source file uses a default style', function (done) {
  expect.assertions(2)

  const argv = ['example/file1.mermaid']

  cli.parse(argv, function (err, msg, opt) {
    expect(!err).toBeTruthy()
    expect(opt.css).toBeTruthy()
    done()
  })
})

test('setting a css source file succeeds', function (done) {
  expect.assertions(2)

  const argv = ['example/file1.mermaid', '-t', 'test/fixtures/test.css']

  cli.parse(argv, function (err, msg, opt) {
    expect(!err).toBeTruthy()
    expect(opt.css).toBeTruthy()
    done()
  })
})

test('setting an output directory incorrectly causes an error', function (done) {
  expect.assertions(1)

  const argv = ['-o']

  cli.parse(argv, function (err) {
    expect(err).toBeTruthy()

    done()
  })
})

test('a callback function is called after parsing', function (done) {
  expect.assertions(3)

  const argv = ['example/file1.mermaid']

  cli.parse(argv, function (err, msg, opts) {
    expect(!err).toBeTruthy()
    expect(true).toBeTruthy()
    expect(argv).toEqual(opts.files)

    done()
  })
})
