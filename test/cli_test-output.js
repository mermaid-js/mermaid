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
  console.log('is win');
  console.log('is win');
}
else{
  phantomCmd = 'node_modules/.bin/phantomjs'
}
var singleFile = {
        files: [fileTestMermaid]
      , outputDir:  path.join(process.cwd(),'test/tmp2/')
      , phantomPath: path.join(process.cwd(),phantomCmd)
      , width : 1200
    }
  , multiFile = {
        files: [path.join('test','fixtures','test.mermaid'), path.join('test','fixtures','test2.mermaid')]
      , outputDir: 'test/tmp2/'
      , phantomPath: path.join(process.cwd(),phantomCmd)
      , width : 1200
    }


test('output of single png', function(t) {
  t.plan(3)

  var expected = ['test.mermaid.png']

  opt = clone(singleFile)
  opt.png = true

  mermaid.process(opt.files, opt, function(code) {
    t.equal(code, 0, 'has clean exit code')

    verifyFiles(expected, opt.outputDir, t)
  })
})

test('output of multiple png', function(t) {
  t.plan(3)

  var expected = ['test.mermaid.png', 'test2.mermaid.png']

  opt = clone(multiFile)
  opt.png = true

  mermaid.process(opt.files, opt, function(code) {
    t.equal(code, 0, 'has clean exit code')

    verifyFiles(expected, opt.outputDir, t)
  })
})

test('output of single svg', function(t) {
  t.plan(3)

  var expected = ['test.mermaid.svg']

  opt = clone(singleFile)
  opt.svg = true

  mermaid.process(opt.files, opt, function(code) {
    t.equal(code, 0, 'has clean exit code')

    verifyFiles(expected, opt.outputDir, t)
  })
})

test('output of multiple svg', function(t) {
  t.plan(3)

  var expected = ['test.mermaid.svg', 'test2.mermaid.svg']

  opt = clone(multiFile)
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
  opt2.png = true


  mermaid.process(opt.files, opt, function(code) {
    t.equal(code, 0, 'has clean exit code')
    filename = path.join(opt.outputDir, path.basename(expected[0]))
    one = fs.statSync(filename)
      //console.log('one: '+opt.files[0]);

    opt2.css = fs.readFileSync(path.join('test','fixtures','test.css'), 'utf8')
      //console.log(opt2.css);

      console.log('Generating #2');
      //console.log('two: '+opt2.files[0]);
    mermaid.process(opt2.files, opt2, function(code) {
      t.equal(code, 0, 'has clean exit code')
      two = fs.statSync(filename)

        //console.log('one: '+one.size);
        //console.log('two: '+two.size);


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

        rimraf(dir, function(rmerr) {
          t.notOk(rmerr, 'cleaned up')
          t.end()
        })
      }
  )
}
