'use strict';
var exec = require('child_process').exec;
var fs = require('fs')
  , path = require('path')

  var test = require('tape')
  , async = require('async')
  , clone = require('clone')
  , rimraf = require('rimraf')

var test_dir = "test/fixtures/samples/".replace('/',path.sep)

rimraf.sync(test_dir+'*.actual.*');
 
function exec_mermaid(args, verify) {
  exec('bin/mermaid.js ' + args, 
    {env: {PATH: "./node_modules/.bin"+path.delimiter+process.env.PATH}}, 
    function(error, stdout, stderr) {
      console.log('error:',error,'\nstdout:\n',stdout,'\nstderr:\n',stderr);
      verify(error, stdout, stderr);
    });
}

test('mermaid cli help', function(t) {
  t.plan(1);
  var args = [ "--help", ]
  exec_mermaid(args.join(" "),
    function(error, stdout, stderr) {
      t.notOk(error, 'no error')
      t.end()
    });
});

test('mermaid cli help', function(t) {
  t.plan(1);
  var args = [ "--badopt", ]
  exec_mermaid(args.join(" "),
    function(error, stdout, stderr) {
      t.ok(stderr, 'should get error')
      t.end()
    });
});

//todo
test.skip('sequence syntax error', function(t) {
  t.plan(1);
  var args = [ "--svg",
    "--outputDir=" + test_dir,
    "--outputSuffix=.actual",
    test_dir+"sequence_err.mmd",
  ]
  exec_mermaid(args.join(" "),
    function(error, stdout, stderr) {
      t.ok(stderr, 'should get error')
      t.end()
    });
});

['', 'fo', 'tspan', 'old'].forEach(function(textPlacement) {
  test('sequence svg text placelment: '+textPlacement, function(t) {
    t.plan(1);
    var args = [ "--svg",
      "--outputDir=" + test_dir,
      "--outputSuffix="+(textPlacement ? "_"+textPlacement : "")+".actual",
      textPlacement ? "--sequenceConfig="+test_dir+"sequence_text_"+textPlacement+".cfg" : "",  
      test_dir+"sequence_text.mmd",
    ]
    exec_mermaid(args.join(" "),
      function(error, stdout, stderr) {
        t.notOk(stderr, 'no error')
        t.end()
      });
  })
});

test('sequence png', function(t) {
  t.plan(1);
  var args = [ "--png",
    "--outputDir=" + test_dir,
    "--outputSuffix=.actual",
    test_dir+"sequence_text.mmd",
  ]
  exec_mermaid(args.join(" "),
    function(error, stdout, stderr) {
      t.notOk(stderr, 'no error')
      t.end()
    });
})

test('flowchart svg text', function(t) {
  t.plan(1);
  var args = [ "--svg",
    "--outputDir=" + test_dir,
    "--outputSuffix=.actual",
    test_dir+"flowchart_text.mmd",
  ]
  exec_mermaid(args.join(" "),
    function(error, stdout, stderr) {
      t.notOk(stderr, 'no error')
      t.end()
    });
})
