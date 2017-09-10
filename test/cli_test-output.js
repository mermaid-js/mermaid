/* eslint-env jest */
/* eslint-env jasmine */
const fs = require('fs')
const path = require('path')

const async = require('async')
const clone = require('clone')
const rimraf = require('rimraf')

const mermaid = require('../lib')

const fileTestMermaid = path.join('test', 'fixtures', 'test.mermaid')
const isWin = /^win/.test(process.platform)
let phantomCmd
if (isWin) {
  phantomCmd = 'node_modules/.bin/phantomjs.cmd'
} else {
  phantomCmd = 'node_modules/.bin/phantomjs'
}
const singleFile = {
  files: [fileTestMermaid],
  outputDir: path.join(process.cwd(), 'test/tmp_single'),
  phantomPath: path.join(process.cwd(), phantomCmd),
  width: 1200,
  css: path.join(__dirname, '..', 'dist', 'mermaid.css'),
  sequenceConfig: null,
  ganttConfig: null
}
const multiFile = {
  files: [path.join('test', 'fixtures', 'test.mermaid'),
    path.join('test', 'fixtures', 'test2.mermaid'),
    path.join('test', 'fixtures', 'gantt.mermaid'),
    path.join('test', 'fixtures', 'sequence.mermaid')
  ],
  outputDir: 'test/tmp_multi',
  phantomPath: path.join(process.cwd(), phantomCmd),
  width: 1200,
  css: path.join(__dirname, '..', 'dist', 'mermaid.css'),
  sequenceConfig: null,
  ganttConfig: null
}

beforeEach(() => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 64000
})

test('output of single png', function (done) {
  expect.assertions(3)

  const expected = ['test.mermaid.png']

  const opt = clone(singleFile)
  opt.outputDir += '_png'
  opt.png = true

  mermaid.process(opt.files, opt, function (code) {
    expect(code).toBe(0)

    verifyFiles(expected, opt.outputDir, done)
  })
})

test('output of multiple png', function (done) {
  expect.assertions(3)

  const expected = ['test.mermaid.png', 'test2.mermaid.png',
    'gantt.mermaid.png', 'sequence.mermaid.png']

  const opt = clone(multiFile)
  opt.outputDir += '_png'
  opt.png = true

  mermaid.process(opt.files, opt, function (code) {
    expect(code).toBe(0)

    verifyFiles(expected, opt.outputDir, done)
  })
})

test('output of single svg', function (done) {
  expect.assertions(3)

  const expected = ['test.mermaid.svg']

  const opt = clone(singleFile)
  opt.outputDir += '_svg'
  opt.svg = true

  mermaid.process(opt.files, opt, function (code) {
    expect(code).toBe(0)

    verifyFiles(expected, opt.outputDir, done)
  })
})

test('output of multiple svg', function (done) {
  expect.assertions(3)

  const expected = ['test.mermaid.svg', 'test2.mermaid.svg',
    'gantt.mermaid.svg', 'sequence.mermaid.svg']

  const opt = clone(multiFile)
  opt.outputDir += '_svg'
  opt.svg = true

  mermaid.process(opt.files, opt, function (code) {
    expect(code).toBe(0)

    verifyFiles(expected, opt.outputDir, done)
  })
})

test('output including CSS', function (done) {
  expect.assertions(5)

  const expected = ['test.mermaid.png']
  const opt = clone(singleFile)
  const opt2 = clone(singleFile)

  opt.png = true
  opt.outputDir += '_css_png'
  opt2.png = true
  opt2.outputDir += '_css_png'

  mermaid.process(opt.files, opt, function (code) {
    expect(code).toBe(0)
    const filename = path.join(opt.outputDir, path.basename(expected[0]))
    const one = fs.statSync(filename)

    opt2.css = path.join('test', 'fixtures', 'test.css')

    mermaid.process(opt2.files, opt2, function (code) {
      expect(code).toBe(0)
      const two = fs.statSync(filename)
      expect(one.size).not.toBe(two.size)

      verifyFiles(expected, opt.outputDir, done)
    })
  })
})

function verifyFiles (expected, dir, done) {
  async.each(
    expected, function (file, cb) {
      const filename = path.join(dir, path.basename(file))
      fs.stat(filename, function (err, stat) {
        cb(err)
      })
    }, function (err) {
      expect(err).toBeFalsy()
      const deleteTmps = true
      const _rimraf = deleteTmps ? rimraf : function (dir, f) { f(0) }
      _rimraf(dir, function (rmerr) {
        expect(rmerr).toBeFalsy()
        done()
      })
    }
  )
}
