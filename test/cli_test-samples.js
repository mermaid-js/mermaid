'use strict';
var exec = require('child_process').exec;
var path = require('path')

  var test = require('tape')
  , rimraf = require('rimraf')

var test_dir = 'test/fixtures/samples/'.replace('/',path.sep)
var phantomjs = 'node_modules/.bin/phantomjs '.replace('/',path.sep)
var load_html_save_screenshot_png_scripts = test_dir+path.sep+'load_html_save_screenshot_png.phantomjs'

rimraf.sync(test_dir+'*.actual.*');

function prepend_output_args(args) {
  return '--outputDir=' + test_dir + ' --outputSuffix=.actual' + args
}

function exec_mermaid(args, verify) {
  var cmd = 'bin/mermaid.js ' + args
  exec_cmd(cmd, verify)
}

function exec_phantomjs_to_load_html_save_screenshot_png(html, verify) {
  var cmd = (phantomjs + ' ' + load_html_save_screenshot_png_scripts + 
    ' ' + html + ' ' + html + '.actual.png');
  exec_cmd(cmd, verify)
}

function exec_cmd(cmd, verify) {
  console.log('cmd: ', cmd)
  exec(cmd,
    {env: {PATH: './node_modules/.bin'+path.delimiter+process.env.PATH}}, 
    function(error, stdout, stderr) {
      console.log('error:',error,'\nstdout:\n',stdout,'\nstderr:\n',stderr);
      verify(error, stdout, stderr);
    });
}

function verify_no_error(t) {
  return function(error, stdout, stderr) {
    t.notOk(stderr, 'no error')
    t.end()
  }
}

function verify_error(t) {
  return function(error, stdout, stderr) {
    t.ok(stderr, 'should get error')
    t.end()
  }
}

test('mermaid cli help', function(t) {
  t.plan(1);
  var args = [ '--help' ]
  exec_mermaid(args.join(' '), verify_no_error(t));
});

test('mermaid cli help', function(t) {
  t.plan(1);
  var args = [ '--badopt' ]
  exec_mermaid(args.join(' '), verify_error(t));
});

test.skip('sequence syntax error', function(t) {
  t.plan(1);
  var args = [ '--svg',
    test_dir+'sequence_err.mmd'
  ]
  exec_mermaid(prepend_output_args(args.join(' ')), verify_no_error(t));
});

['', 'fo', 'tspan', 'old'].forEach(function(textPlacement) {
  test('sequence svg text placelment: '+textPlacement, function(t) {
    t.plan(1);
    var args = [ '--svg',
      '--outputDir=' + test_dir,
      '--outputSuffix='+(textPlacement ? '_'+textPlacement : '')+'.actual',
      textPlacement ? '--sequenceConfig='+test_dir+'sequence_text_'+textPlacement+'.cfg' : '',  
      test_dir+'sequence_text.mmd'
    ]
    exec_mermaid(args.join(' '), verify_no_error(t));
  })
});

test('sequence png', function(t) {
  t.plan(1);
  var args = [ '--png',
    test_dir+'sequence_text.mmd'
  ]
  exec_mermaid(prepend_output_args(args.join(' ')), verify_no_error(t));
});

test('flowchart svg text', function(t) {
  t.plan(1);
  var args = [ '--svg',
    '--css=dist/mermaid.css',
    '--width=500',
    test_dir+'flowchart_text.mmd'
  ]
  exec_mermaid(prepend_output_args(args.join(' ')), verify_no_error(t));
});

['svg', 'png'].forEach(function(format) {
  test('flowchart '+format+'text2', function(t) {
  t.plan(1);
  var args = [ '--'+format,
    '--css=dist/mermaid.forest.css',
    '--width=500',
    test_dir+'flowchart_text2.mmd'
  ]
  exec_mermaid(prepend_output_args(args.join(' ')), verify_no_error(t));
}) });


test('gantt axis formatter svg', function(t) {
  t.plan(1);
  var args = [ '--svg',
    '--css=dist/mermaid.css',
    '--width=500',
    '--ganttConfig='+test_dir+'gantt_axis_formatter.cfg',  
    test_dir+'gantt_axis_formatter.mmd'
  ]
  exec_mermaid(prepend_output_args(args.join(' ')), verify_no_error(t));
});


test('gitgraph sample svg', function(t) {
  t.plan(1);
  var args = [ '-s', '-v',
    '--width=500',
    test_dir+'gitgraph.mmd'
  ]
  exec_mermaid(prepend_output_args(args.join(' ')), verify_no_error(t));
});

test('load sample.html in phantomjs and save screenshot png', function(t) {
  t.plan(1);
  exec_phantomjs_to_load_html_save_screenshot_png(test_dir+'samples.html', 
    verify_no_error(t));
});
