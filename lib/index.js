#!/usr/bin/env node

const omit = require('lodash.omit')
const split = require('split')
const chalkOrg = require('chalk')
const chalk = new chalkOrg.Instance({level: 3});
const fs = require('fs')
const gv = require('get-value')
const formatLine = require('./process-line.js')
const help = require('./help.js')
const getRandomColor = require('./random-color.js')

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
console.log(argv)
const defaultLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']
const defaultLevelsColors = {
  error: chalk.bold.redBright,
  warn: chalk.rgb(255, 136, 0),
  info: chalk.greenBright,
  http: chalk.rgb(190,190,190),
  verbose: chalk.cyanBright,
  debug: chalk.blueBright,
  silly: chalk.magentaBright
}

const colors = [
  chalk.bold.redBright,
  chalk.rgb(255, 136, 0),
  chalk.greenBright,
  chalk.rgb(190,190,190),
  chalk.cyanBright,
  chalk.blueBright,
  chalk.magentaBright
]

const areCustomLevels = argv.levels ? true : false
const levels = argv.levels ? Array.isArray(argv.levels) ? argv.levels : [argv.levels]
  : Object.keys(defaultLevelsColors)
const areLevelsFromDefault = levels.length === defaultLevels.length
  && levels.every(lvl => defaultLevels.indexOf(lvl) > -1)

let levelsColors
if (areLevelsFromDefault) {
  levelsColors = levels.reduce((group, lvl, i) => {
    group[lvl] = defaultLevelsColors[lvl]
    return group
  }, {})
} else {
  levelsColors = levels.reduce((group, lvl, i) => {
    let color;
    let hexColor = getRandomColor(lvl)
    color = chalk.hex(hexColor).bold
    group[lvl] = color
    return group
  }, {})
}
debugger
if (levels.length !== Object.keys(levelsColors).length) {
  throw new Error('All levels\' colors not set')
}

const level = argv.level || levels[levels.length - 1]
const alias = argv.alias
  ? Array.isArray(argv.alias) ?
    argv.alias : argv.alias.split(',')
  : []
const aliases = alias.reduce( (grp, a) => {
  const [key, val] = a.split(':')
  grp[key] = val
  return grp
}, {})

const colorIt = function (str) {
  let colored
  if (levelsColors[str]) {
    colored = levelsColors[str](str)
  } else {
    let hexColor = getRandomColor(str)
    colored = chalk.hex(hexColor).bold(str)
  }
  return colored
}


const opts = {
  levelsColors, levels, level, aliases, colorIt, inject,
  levelIdx: level ? levels.indexOf(level) : levels.length - 1,
  includeLevels: argv['include-levels'] || false,
  excludeLevels: argv['exclude-levels'] || false,
  mainKeys: {
    time: aliases.time || 'time',
    level: aliases.level || 'level',
    message: aliases.message || 'message'
  },
  template: argv.template || '[{time}]\t{color:level}\t{message}\t{address.city}',
  debug: argv.debug || false
}

console.log(opts)

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
      before.forEach(data => console.log(formatter(data, opts)))
    }
    before = []
    console.log(out.output)
    afterEnabled = argv.context
  } else if (argv.context && out.discarded) {
    //console.log('discarded: ' + out.discarded.message)
    if (afterEnabled >= 0) {
      console.log(formatter(out.discarded, opts))
      if (afterEnabled === 0) console.log('...')
    } else {
      if (after.length > 0)
      //after.forEach(data => console.log(formatter(data, opts)))
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


function formatter (json, opts) {
  let color = levelsColors[json.level]
  if (!color) {
    let hexColor = getRandomColor(json.level)
    color = chalk.hex(hexColor).bold
  }
  return [
    //json.time.replace(/^.*T(.*)[Z|+].*/, '$1'),
    json[opts.mainKeys.time],
    color(json[opts.mainKeys.level]),
    color(json[opts.mainKeys.message]),
    JSON.stringify(omit(json, [opts.mainKeys.time, opts.mainKeys.level, opts.mainKeys.message]))
  ].join('  ')
}

// credit https://stackoverflow.com/a/56112700/713573
// let inject = (str, obj) => str.replace(/\${(.*?)}/g, (x,g)=> obj[g]);

function inject (template, obj, colorIt) {
  let keys = []
  let dataStr = template.replace(/{(.*?)}/g, (x,key)=> {
    if (key === 'REST') return `{${key}}`
    let match = key.trim().match(/^color:(.*)/);
    let val;
    if (match) {
      key = match[1]
      val = colorIt(gv(obj, key), key);
    } else {
      val = gv(obj, key);
    }
    keys.push(key)
    return val;
  })
  if (keys.length > 0 && /{REST}/.test(dataStr)) {
    let rest = omit(obj, keys)
    dataStr = dataStr.replace(/{REST}/, JSON.stringify(rest))
  }
  return dataStr
}
