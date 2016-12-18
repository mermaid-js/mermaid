var fs = require('fs')
  , path = require('path')

var test = require('tape')
  , async = require('async')
  , clone = require('clone')
  , rimraf = require('rimraf')

var mermaid = require('../lib')

var fileTestMermaid = path.join('test','fixtures','test.mermaid');
var isWin = /^win/.test(process.platform);
var phantomCmd;
if(isWin){
  phantomCmd = 'node_modules/.bin/phantomjs.cmd'
  console.log('is win')
}
else{
  phantomCmd = 'node_modules/.bin/phantomjs'
}
var singleFile = {
        files: [fileTestMermaid]
      , outputDir:  path.join(process.cwd(),'test/tmp_single')
      , phantomPath: path.join(process.cwd(),phantomCmd)
      , width : 1200
      , css: path.join(__dirname, '..', 'dist', 'mermaid.css')
      , sequenceConfig: null
      , ganttConfig: null
    }
  , multiFile = {
        files: [path.join('test','fixtures','test.mermaid'), 
                path.join('test','fixtures','test2.mermaid'),
                path.join('test','fixtures','gantt.mermaid'),
                path.join('test','fixtures','sequence.mermaid'),
                ]
      , outputDir: 'test/tmp_multi'
      , phantomPath: path.join(process.cwd(),phantomCmd)
      , width : 1200
      , css: path.join(__dirname, '..', 'dist', 'mermaid.css')
      , sequenceConfig: null
      , ganttConfig: null
    }


test('output of single png', function(t) {
  t.plan(3)

  var expected = ['test.mermaid.png']

  var opt = clone(singleFile)
  opt.outputDir += '_png'
  opt.png = true
 
  mermaid.process(opt.files, opt, function(code) {
    t.equal(code, 0, 'has clean exit code')

    verifyFiles(expected, opt.outputDir, t)
  })
})

test('output of multiple png', function(t) {
  t.plan(3)

  var expected = ['test.mermaid.png', 'test2.mermaid.png', 
    'gantt.mermaid.png', 'sequence.mermaid.png']

  var opt = clone(multiFile)
  opt.outputDir += '_png'
  opt.png = true

  mermaid.process(opt.files, opt, function(code) {
    t.equal(code, 0, 'has clean exit code')

    verifyFiles(expected, opt.outputDir, t)
  })
})

test('output of single svg', function(t) {
  t.plan(3)

  var expected = ['test.mermaid.svg']

  var opt = clone(singleFile)
  opt.outputDir += '_svg'
  opt.svg = true

  mermaid.process(opt.files, opt, function(code) {
    t.equal(code, 0, 'has clean exit code')

    verifyFiles(expected, opt.outputDir, t)
  })
})

test('output of multiple svg', function(t) {
  t.plan(3)

  var expected = ['test.mermaid.svg', 'test2.mermaid.svg', 
    'gantt.mermaid.svg', 'sequence.mermaid.svg']

  var opt = clone(multiFile)
  opt.outputDir += '_svg'
  opt.svg = true

  mermaid.process(opt.files, opt, function(code) {
    t.equal(code, 0, 'has clean exit code')

    verifyFiles(expected, opt.outputDir, t)
  })
})

test('output including CSS', function(t) {
  t.plan(5)

  var expected = ['test.mermaid.png']
    , opt = clone(singleFile)
    , opt2 = clone(singleFile)
    , filename
    , one
    , two

  opt.png = true
  opt.outputDir += '_css_png'
  opt2.png = true
  opt2.outputDir += '_css_png'


  mermaid.process(opt.files, opt, function(code) {
    t.equal(code, 0, 'has clean exit code')
    filename = path.join(opt.outputDir, path.basename(expected[0]))
    one = fs.statSync(filename)

    opt2.css = path.join('test','fixtures','test.css')

    console.log('Generating #2');
    mermaid.process(opt2.files, opt2, function(code) {
      t.equal(code, 0, 'has clean exit code')
      two = fs.statSync(filename)
      t.notEqual(one.size, two.size)

      verifyFiles(expected, opt.outputDir, t)
    })
  })
})

function verifyFiles(expected, dir, t) {
  async.each(
      expected
    , function(file, cb) {
        filename = path.join(dir, path.basename(file))
        //console.log('Expected filename:'+filename);
        fs.stat(filename, function(err, stat) {
          cb(err)
        })
      }
    , function(err) {
        t.notOk(err, 'all files passed')
        var delete_tmps = true
        var _rimraf=delete_tmps ? rimraf : function(dir, f) { f(0); }
        _rimraf(dir, function(rmerr) {
          t.notOk(rmerr, 'cleaned up')
          t.end()
        })
      }
  )
}
