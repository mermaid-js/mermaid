#!/usr/bin/env node

import chalk from 'chalk'

import cli from '../lib/cli'
import lib from '../lib'

cli.parse(process.argv.slice(2), function (err, message, options) {
  if (err) {
    console.error(
      chalk.bold.red('\nYou had errors in your syntax. Use --help for further information.')
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
