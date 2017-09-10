/* eslint-env jest */
/* eslint-env jasmine */
const exec = require('child_process').exec
const path = require('path')

const rimraf = require('rimraf')

const localSearchPath = './node_modules/.bin' + path.delimiter + process.env.PATH
const testDir = 'test/fixtures/samples/'.replace('/', path.sep)
const phantomjs = 'node_modules/.bin/phantomjs '.replace('/', path.sep)
const loadHtmlSaveScreenshotPngScripts = testDir + path.sep + 'load_html_save_screenshot_png.phantomjs'

rimraf.sync(testDir + '*.actual.*')

function prependOutputArgs (args) {
  return '--outputDir=' + testDir + ' --outputSuffix=.actual' + args
}

function execMermaid (args, verify) {
  const cmd = 'bin/mermaid.js ' + args
  execCmd(cmd, verify)
}

function execPhantomjsToLoadHtmlSaveScreenshotPng (html, verify) {
  const cmd = (phantomjs + ' ' + loadHtmlSaveScreenshotPngScripts +
    ' ' + html + ' ' + html + '.actual.png')
  execCmd(cmd, verify)
}

function execCmd (cmd, verify) {
  console.log('cmd: ', cmd)
  exec(cmd,
    { env: Object.assign({}, process.env, { PATH: localSearchPath }) },
    function (error, stdout, stderr) {
      console.log('error:', error, '\nstdout:\n', stdout, '\nstderr:\n', stderr)
      verify(error, stdout, stderr)
    })
}

function verifyNoError (done) {
  return function (error, stdout, stderr) {
    expect(!error).toBeTruthy()
    expect(stderr).toBeFalsy()
    done()
  }
}

function verifyError (done) {
  return function (error, stdout, stderr) {
    expect(!error).toBeTruthy()
    expect(stderr).toBeTruthy()
    done()
  }
}

beforeEach(() => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 64000
})

test('mermaid cli help', function (done) {
  expect.assertions(2)
  const args = ['--help']
  execMermaid(args.join(' '), verifyNoError(done))
})

test('mermaid cli help', function (done) {
  expect.assertions(2)
  const args = ['--badopt']
  execMermaid(args.join(' '), verifyError(done))
});

['', 'fo', 'tspan', 'old'].forEach(function (textPlacement) {
  test('sequence svg text placement: ' + textPlacement, function (done) {
    expect.assertions(2)
    const args = ['--svg',
      '--outputDir=' + testDir,
      '--outputSuffix=' + (textPlacement ? '_' + textPlacement : '') + '.actual',
      textPlacement ? '--sequenceConfig=' + testDir + 'sequence_text_' + textPlacement + '.cfg' : '',
      testDir + 'sequence_text.mmd'
    ]
    execMermaid(args.join(' '), verifyNoError(done))
  })
})

test('sequence png', function (done) {
  expect.assertions(2)
  const args = ['--png',
    testDir + 'sequence_text.mmd'
  ]
  execMermaid(prependOutputArgs(args.join(' ')), verifyNoError(done))
})

test('flowchart svg text', function (done) {
  expect.assertions(2)
  const args = ['--svg',
    '--css=dist/mermaid.css',
    '--width=500',
    testDir + 'flowchart_text.mmd'
  ]
  execMermaid(prependOutputArgs(args.join(' ')), verifyNoError(done))
});

['svg', 'png'].forEach(function (format) {
  test('flowchart ' + format + 'text2', function (done) {
    expect.assertions(2)
    const args = ['--' + format,
      '--css=dist/mermaid.forest.css',
      '--width=500',
      testDir + 'flowchart_text2.mmd'
    ]
    execMermaid(prependOutputArgs(args.join(' ')), verifyNoError(done))
  })
})

test('gantt axis formatter svg', function (done) {
  expect.assertions(2)
  const args = ['--svg',
    '--css=dist/mermaid.css',
    '--width=500',
    '--ganttConfig=' + testDir + 'gantt_axis_formatter.cfg',
    testDir + 'gantt_axis_formatter.mmd'
  ]
  execMermaid(prependOutputArgs(args.join(' ')), verifyNoError(done))
})

test('gitgraph sample svg', function (done) {
  expect.assertions(2)
  const args = ['-s', '-v',
    '--width=500',
    testDir + 'gitgraph.mmd'
  ]
  execMermaid(prependOutputArgs(args.join(' ')), verifyNoError(done))
})

test('load sample.html in phantomjs and save screenshot png', function (done) {
  expect.assertions(2)
  execPhantomjsToLoadHtmlSaveScreenshotPng(testDir + 'samples.html',
    verifyNoError(done))
})
