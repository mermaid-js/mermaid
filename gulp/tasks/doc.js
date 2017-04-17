var gulp = require('gulp')
var vartree = require('gulp-vartree')
var gmarked = require('gulp-marked')
var concat = require('gulp-concat')
var frontMatter = require('gulp-front-matter')
var hogan = require('hogan.js')
var es = require('event-stream')
var fs = require('fs')

// Compile a template for rendering each page
var template = hogan.compile(String(fs.readFileSync('docs/tpl/slate.html')))

var root = {}
var filelist = []
var iterator = function (obj) {
  var i
  for (i = 0; i < obj.childs.length; i++) {
    var item = obj.childs[i]
    if (item.folder) {
      iterator(item)
    } else {
      console.log(item.path + item.name)
      filelist.push('build/www' + '/' + item.path + item.name + '.html')
    }
  }
}

var renderer = {
  code: function (code, language) {
    if (language === 'mermaid') {
      return '<div class="mermaid">' + code + '</div>'
    } else {
      language = 'css'
      return '<pre class="' + language + '"><code>' + code + '</code></pre>'
    }
  }
}
var filelog = require('gulp-filelog')

gulp.task('vartree', ['dox', 'copyContent', 'copySite'], function () {
  gulp.src(['build/content/**/*.md'])
    .pipe(filelog())
    .pipe(frontMatter({
      property: 'order' // will put metadata in the file.meta property
    }))
    .pipe(vartree({
      root: root, // the root in which the vartree will be put
      prop: 'order', // metadata property to collect
      sortProp: 'order',
      parent: 'parent' // keep a ref to the parent scope in the file.parent property
    }))
    .pipe(gmarked({
      renderer: renderer,
      sanitize: false
    })) // Do whatever you want with the files later
    .pipe(gulp.dest('build/www')).on('end', function () {
      iterator(root)
      gulp.src(filelist)
        .pipe(concat('all.html'))
        .pipe(gulp.dest('./build/www')).on('end', function () {
          filelist.push('build/www' + '/all.html')

          gulp.src(filelist)
            .pipe(filelog('html files'))
            // Run each file through a template
            .pipe(es.map(function (file, cb) {
              file.contents = Buffer.from(template.render(file))

              cb(null, file)
            }))
            // Output to build directory
            .pipe(gulp.dest('./dist/www'))
        })
    })
})

var dox = require('gulp-dox')

var map = require('map-stream')
var extReplace = require('gulp-ext-replace')

gulp.task('dox', function () {
  return gulp.src(['./src/**/mermaidAPI.js'])
    .pipe(filelog())
    .pipe(dox({
      'raw': true
    }))
    .pipe(map(function (file, done) {
      var json = JSON.parse(file.contents.toString())
      var i
      var str = ''
      for (i = 0; i < json.length; i++) {
        str = str + json[i].description.full + '\n'
      }
      file.contents = Buffer.from(str)
      done(null, file)
    }))
    .pipe(extReplace('.md'))
    .pipe(gulp.dest('./build/content'))
})

gulp.task('copyContent', function () {
  return gulp.src(['./docs/content/**/*.md'])
    .pipe(gulp.dest('./build/content'))
})

gulp.task('copyContent', function () {
  return gulp.src(['./docs/content/**/*.md'])
    .pipe(gulp.dest('./build/content'))
})

gulp.task('copySite', function () {
  gulp.src(['./dist/mermaid.js'])
    .pipe(filelog())
    .pipe(gulp.dest('./dist/www/javascripts/lib'))
  gulp.src(['./docs/site/**/*.css'])
    .pipe(filelog())
    .pipe(gulp.dest('./dist/www'))
  gulp.src(['./docs/site/**/*.eot'])
    .pipe(gulp.dest('./dist/www'))
  gulp.src(['./docs/site/**/*.svg'])
    .pipe(gulp.dest('./dist/www'))
  gulp.src(['./docs/site/**/*.png'])
    .pipe(gulp.dest('./dist/www'))
  gulp.src(['./docs/site/**/*.jpg'])
    .pipe(gulp.dest('./dist/www'))
  gulp.src(['./docs/site/**/*.ttf'])
    .pipe(gulp.dest('./dist/www'))
  gulp.src(['./docs/site/**/*.woff'])
    .pipe(gulp.dest('./dist/www'))
  gulp.src(['./docs/site/**/*.woff2'])
    .pipe(gulp.dest('./dist/www'))
  return gulp.src(['./docs/site/**/*.js'])
    .pipe(gulp.dest('./dist/www'))
})
