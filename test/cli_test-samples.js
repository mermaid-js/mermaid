const exec = require('child_process').exec
const path = require('path')

const test = require('tape')
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

function verifyNoError (t) {
  return function (error, stdout, stderr) {
    t.ok(!error, 'no error')
    t.notOk(stderr, 'no stderr')
    t.end()
  }
}

function verifyError (t) {
  return function (error, stdout, stderr) {
    t.ok(!error, 'no error')
    t.ok(stderr, 'should get stderr')
    t.end()
  }
}

test('mermaid cli help', function (t) {
  t.plan(2)
  const args = ['--help']
  execMermaid(args.join(' '), verifyNoError(t))
})

test('mermaid cli help', function (t) {
  t.plan(2)
  const args = ['--badopt']
  execMermaid(args.join(' '), verifyError(t))
})

test.skip('sequence syntax error', function (t) {
  t.plan(2)
  const args = ['--svg',
    testDir + 'sequence_err.mmd'
  ]
  execMermaid(prependOutputArgs(args.join(' ')), verifyNoError(t))
});

['', 'fo', 'tspan', 'old'].forEach(function (textPlacement) {
  test('sequence svg text placement: ' + textPlacement, function (t) {
    t.plan(2)
    const args = ['--svg',
      '--outputDir=' + testDir,
      '--outputSuffix=' + (textPlacement ? '_' + textPlacement : '') + '.actual',
      textPlacement ? '--sequenceConfig=' + testDir + 'sequence_text_' + textPlacement + '.cfg' : '',
      testDir + 'sequence_text.mmd'
    ]
    execMermaid(args.join(' '), verifyNoError(t))
  })
})

test('sequence png', function (t) {
  t.plan(2)
  const args = ['--png',
    testDir + 'sequence_text.mmd'
  ]
  execMermaid(prependOutputArgs(args.join(' ')), verifyNoError(t))
})

test('flowchart svg text', function (t) {
  t.plan(2)
  const args = ['--svg',
    '--css=dist/mermaid.css',
    '--width=500',
    testDir + 'flowchart_text.mmd'
  ]
  execMermaid(prependOutputArgs(args.join(' ')), verifyNoError(t))
});

['svg', 'png'].forEach(function (format) {
  test('flowchart ' + format + 'text2', function (t) {
    t.plan(2)
    const args = ['--' + format,
      '--css=dist/mermaid.forest.css',
      '--width=500',
      testDir + 'flowchart_text2.mmd'
    ]
    execMermaid(prependOutputArgs(args.join(' ')), verifyNoError(t))
  })
})

test('gantt axis formatter svg', function (t) {
  t.plan(2)
  const args = ['--svg',
    '--css=dist/mermaid.css',
    '--width=500',
    '--ganttConfig=' + testDir + 'gantt_axis_formatter.cfg',
    testDir + 'gantt_axis_formatter.mmd'
  ]
  execMermaid(prependOutputArgs(args.join(' ')), verifyNoError(t))
})

test('gitgraph sample svg', function (t) {
  t.plan(2)
  const args = ['-s', '-v',
    '--width=500',
    testDir + 'gitgraph.mmd'
  ]
  execMermaid(prependOutputArgs(args.join(' ')), verifyNoError(t))
})

test('load sample.html in phantomjs and save screenshot png', function (t) {
  t.plan(2)
  execPhantomjsToLoadHtmlSaveScreenshotPng(testDir + 'samples.html',
    verifyNoError(t))
})
