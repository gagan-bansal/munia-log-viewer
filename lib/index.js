#!/usr/bin/env node

const omit = require('lodash.omit')
const split = require('split')
const chalkOrg = require('chalk')
const chalk = new chalkOrg.Instance({level: 3});
const fs = require('fs')
const processLine = require('./process-line.js')
const help = require('./help.js')

const argv = require('minimist')(process.argv.slice(2), {
  string: 'i',
  alias: {
    i: 'input',
    l: 'level',
    h: 'help',
    l: 'level',
    s: 'levels',
    a: 'alias',
    'aliases': 'alias',
    f: 'from-time',
    t: 'to-time',
    d: 'debug',
    C: 'context'
  }
})
console.log(argv)

const levelColors = {
  error: chalk.bold.redBright,
  warn: chalk.rgb(255, 136, 0),
  info: chalk.greenBright,
  http: chalk.rgb(190,190,190),
  verbose: chalk.cyanBright,
  debug: chalk.blueBright,
  silly: chalk.magentaBright
}

const levels = Object.keys(levelColors)
const level = argv.level
const alias = argv.alias
  ? Array.isArray(argv.alias) ?
    argv.alias : argv.alias.split(',')
  : []
const aliases = alias.reduce( (grp, a) => {
  const [key, val] = a.split(':')
  grp[key] = val
  return grp
}, {})

const opts = {
  levelColors, levels, level, aliases,
  levelIdx: level ? levels.indexOf(level) : levels.length - 1,
  mainKeys: {
    time: aliases.time || 'time',
    level: aliases.level || 'level',
    message: aliases.message || 'message'
  },
  debug: argv.debug || false
}


let before = []
let after = []
let afterEnabled = 0

if (argv.help) {
  console.log(help())
} else if (argv.input) {
  fs.createReadStream(argv.input).pipe(split())
  .on('data', function (line) {
    //console.log('line: ' + line)
    afterEnabled -= 1
    let out = processLine(line, opts)

    if (out.output) {
      if (before.length > 0) {
        console.log('---')
        before.forEach(data => console.log(serialize(data, opts)))
      }
      before = []
      console.log(out.output)
      afterEnabled = 5
    } else if (out.discarded) {
      //console.log('discarded: ' + out.discarded.message)
      if (afterEnabled >= 0) {
        console.log(serialize(out.discarded, opts))
        if (afterEnabled === 0) console.log('---') 
      } else {
        if (after.length > 0) 
        //after.forEach(data => console.log(serialize(data, opts)))
        after = []
        before = addBefore(out.discarded, before)
      }

    }
  })
  .on('end', () => {
    // process.stdin.pipe(split()).on('data', processLine)
  })
} else {
  process.stdin.pipe(split()).on('data', processLine.bind(opts))
}

function addBefore(ele, array) {
  if (array.length === 5) {
    array.shift();
  }
  array.push(ele);
  return array;
}

function addAfter(ele, array) {
  if (array.length === 5) {
    array.pop();
  }
  array.unshift(ele);
  return array;
}


function serialize (json, opts) {
  let color = opts.levelColors[json.level]
  return [
    //json.time.replace(/^.*T(.*)[Z|+].*/, '$1'),
    json[opts.mainKeys.time],
    color(json[opts.mainKeys.level]),
    color(json[opts.mainKeys.message]),
    JSON.stringify(omit(json, [opts.mainKeys.time, opts.mainKeys.level, opts.mainKeys.message]))
  ].join('  ')
}
