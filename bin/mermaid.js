#!/usr/bin/env node

// var fs = require('fs')
var chalk = require('chalk')
var error = chalk.bold.red
var cli = require('../lib/cli.js')
var lib = require('../lib')

cli.parse(process.argv.slice(2), function (err, message, options) {
  if (err) {
    console.error(
      error('\nYou had errors in your syntax. Use --help for further information.')
    )
    err.forEach(function (e) {
      console.error(e.message)
    })

    return
  } else if (message) {
    console.log(message)

    return
  }

  lib.process(options.files, options, process.exit)
})
