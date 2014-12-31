var gulp = require('gulp');
var data = require('gulp-data');
var fm = require('front-matter');
var marked = require('marked');
var fs = require('fs');
var es = require('event-stream');
var hogan = require('hogan.js');
var ext_replace = require('gulp-ext-replace');


var fileList = [];
gulp.task('indexSite', function() {
    return gulp.src('docs/**/*.md')
        // Extract YAML front-matter, convert content to markdown via gulp-data
        .pipe(data(function(file) {
            var name = file.relative.substr(0,file.relative.length-3);
            fileList.push({name:name});
        }));
});

gulp.task('site',['indexSite'], function() {
    var renderer = new marked.Renderer();
    renderer.table = function (header, body) {
        return "<table class=\"ink-table bordered hover alternating\">" +header + body+ "</table>";
    };
    renderer.code = function (code, language) {
        if(code.match(/^sequenceDiagram/)||code.match(/^graph/)){

            return '<div class="mermaid">'+code+'</div>';
        }
        else{
            return '<pre><code>'+code+'</code></pre>';
        }
    };
    // Compile a template for rendering each page
    var template = hogan.compile(String(fs.readFileSync('tpl/ink.html')));

    return gulp.src('docs/**/*.md')

        // Extract YAML front-matter, convert content to markdown via gulp-data
        .pipe(data(function(file) {
            var content = fm(String(file.contents));
            //console.log('yaml:',file.relative);
            file.contents = new Buffer(marked(content.body, {renderer:renderer}));
            file.apa = content.apa;
            file.bapa = 'chimp';

            var name = file.relative.substr(0,file.relative.length-3);
            file.name = name;

            var list = [];

            fileList.forEach(function(item){
                var active = false;
                if(item.name === name){
                    active = true;
                }
                list.push({name:item.name,active:active});
            });
            file.list = list;

            return content.attributes;
        }))


        // Run each file through a template
        .pipe(es.map(function(file, cb) {
            //console.log('file:',fileList);
            file.contents = new Buffer(template.render(file));

            cb(null, file);
        }))
        .pipe(ext_replace('.html'))
        // Output to build directory
        .pipe(gulp.dest('./'));
});

gulp.task('www', ['indexSite'], function() {
    console.log('Starting webserver. Running at: http://127.0.0.1:3000/');
    console.log('Hold ctrl+c to quit.');
    var express = require('express');
    var app = express();

    app.use('/dist/', express.static('./dist'));
    app.use('/', express.static('./'));

    app.listen(process.env.PORT || 3000);
});