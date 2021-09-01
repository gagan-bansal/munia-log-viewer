#!/usr/bin/env node

const omit = require('lodash.omit')
const split = require('split')
const chalkOrg = require('chalk')
const chalk = new chalkOrg.Instance({level: 3});
const fs = require('fs')
const formatLine = require('./process-line.js')
const help = require('./help.js')

const argv = require('minimist')(process.argv.slice(2), {
  string: 'i',
  alias: {
    i: 'input',
    l: 'level',
    h: 'help',
    l: 'level',
    a: 'alias',
    'aliases': 'alias',
    f: 'include-levels',  // f - filter
    e: 'exclude-levels',
    d: 'debug',
    C: 'context'
  }
})
//console.log(argv)

const defaultLevelsColors = {
  error: chalk.bold.redBright,
  warn: chalk.rgb(255, 136, 0),
  info: chalk.greenBright,
  http: chalk.rgb(190,190,190),
  verbose: chalk.cyanBright,
  debug: chalk.blueBright,
  silly: chalk.magentaBright
}

const levels = argv.levels ? Array.isArray(argv.levels) ? argv.levels : [argv.levels]
  : Object.keys(defaultLevelsColors)
let levelsColors
if (argv['levels-map']) {
  levelsColors = argv['levels-map'].reduce((group, lvl, i) => {
    color = defaultLevelsColors[lvl]
    if (!color) throw new Error('Color could not found be set for: ' + lvl)
    group[levels[i]] = color
    return group
  }, {})
} else {
  levelsColors = levels.reduce((group, lvl, i) => {
    color = defaultLevelsColors[lvl]
    if (!color) throw new Error('Color could not found be set for: ' + lvl)
    group[lvl] = color
    return group
  }, {})
}
if (levels.length !== Object.keys(levelsColors).length) {
  throw new Error('All levels\' colors not set')
}

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
  levelsColors, levels, level, aliases,
  levelIdx: level ? levels.indexOf(level) : levels.length - 1,
  includeLevels: argv['include-levels'] || false,
  excludeLevels: argv['exclude-levels'] || false,
  mainKeys: {
    time: aliases.time || 'time',
    level: aliases.level || 'level',
    message: aliases.message || 'message'
  },
  debug: argv.debug || false
}

// console.log(opts)

let before = []
let after = []
let afterEnabled = 0

if (argv.help) {
  console.log(help())
} else if (argv.input) {
  fs.createReadStream(argv.input).pipe(split())
  .on('data', processLine)
  .on('end', () => {
    // process.stdin.pipe(split()).on('data', processLine)
  })
} else {
  process.stdin.pipe(split()).on('data', function (line) {
    let out = formatLine(line, opts)
    if (out.output) console.log(out.output)
  })
}

function processLine (line) {
  //console.log('line: ' + line)
  afterEnabled -= 1
  let out = formatLine(line, opts)
  if (out.output) {
    if (before.length > 0) {
      console.log('...')
      before.forEach(data => console.log(serialize(data, opts)))
    }
    before = []
    console.log(out.output)
    afterEnabled = argv.context
  } else if (argv.context && out.discarded) {
    //console.log('discarded: ' + out.discarded.message)
    if (afterEnabled >= 0) {
      console.log(serialize(out.discarded, opts))
      if (afterEnabled === 0) console.log('...')
    } else {
      if (after.length > 0)
      //after.forEach(data => console.log(serialize(data, opts)))
      after = []
      before = addBefore(out.discarded, before, argv.context)
    }
  } else if (out.raw) {
    console.log(out.raw)
  }
}

function addBefore(ele, array, context) {
  if (array.length === context) {
    array.shift();
  }
  array.push(ele);
  return array;
}


function serialize (json, opts) {
  let color = opts.levelsColors[json.level]
  return [
    //json.time.replace(/^.*T(.*)[Z|+].*/, '$1'),
    json[opts.mainKeys.time],
    color(json[opts.mainKeys.level]),
    color(json[opts.mainKeys.message]),
    JSON.stringify(omit(json, [opts.mainKeys.time, opts.mainKeys.level, opts.mainKeys.message]))
  ].join('  ')
}
