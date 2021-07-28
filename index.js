#!/usr/bin/env node

const split = require('split')
const chalkOrg = require('chalk')
const chalk = new chalkOrg.Instance({level: 3});
const omit = require('lodash.omit')
const fs = require('fs')
const levels = {
  error: chalk.bold.redBright,
  warn: chalk.rgb(255, 136, 0),
  info: chalk.greenBright,
  http: chalk.rgb(190,190,190),
  verbose: chalk.cyanBright,
  debug: chalk.blueBright,
  silly: chalk.magentaBright
}

const file = process.argv[2]
if (process.argv[2]) {
  fs.createReadStream(file).pipe(split())
  .on('data', processLine)
  .on('end', () => {
    process.stdin.pipe(split()).on('data', processLine)
  })
} else {
  process.stdin.pipe(split()).on('data', processLine)
}

function processLine (line) {
  let output
  try {
    data = JSON.parse(line)
    if (data) {
      let color = levels[data.level]
      // output = levels[data.level](Object.values(data).join('  '))
      output = [
        data.timestamp.replace(/^.*T(.*)[Z|+].*/, '$1'),
        color(data.level),
        color(data.message),
        JSON.stringify(omit(data, ['timestamp', 'level', 'message']))
      ].join('  ')
    }
  } catch(err) {
    output = line
  }
  console.log(output)
}

