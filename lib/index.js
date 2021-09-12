#!/usr/bin/env node

const minimist = require('minimist')
const { parseArgsStringToArgv } = require('string-argv')
const omit = require('lodash.omit')
const split = require('split')
// const chalkOrg = require('chalk')
// const chalk = new chalkOrg.Instance({level: 3});
const chalk = require('chalk')
const fs = require('fs')
const gv = require('get-value')
const ld = require('lodash')
const op = require('object-path')
const help = require('./help.js')
const getRandomColor = require('./random-color.js')

const defaultLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']
const defaultLevelsColors = {
  error: chalk.bold.redBright,
  warn: chalk.rgb(255, 136, 0),
  info: chalk.greenBright,
  http: chalk.rgb(190, 190, 190),
  verbose: chalk.cyanBright,
  debug: chalk.blueBright,
  silly: chalk.magentaBright
}

const argv = minimist(process.argv.slice(2), {
  string: ['i', 'l'],
  boolean: ['d', 'h', 'a'],
  default: {
    'd': false,
    'h': false,
    't': '[{time}] {level: -c}: {meggage}',
    'l': 'level',
    'a': true
  },
  alias: {
    i: 'input',
    t: 'template',
    l: 'level-key',
    C: 'context',
    a: 'all',
    d: 'debug',
    h: 'help'
  }
})

const options = argv
const [format, keys] = parseTemplate(argv.template)
options.format = format
options.keys = keys
// basic parsing is over now
setColorFunc(options)
options.filters = setFilterFunc(options)
options.formatter = formatter
console.log(options)

let before = []
let after = []
let afterEnabled = 0

if (argv.help) {
  console.log(help())
} else if (argv.input) {
  fs.createReadStream(argv.input).pipe(split())
  .on('data', (line => {
    processLine(line, options)
  }))
  .on('end', () => {
    // process.stdin.pipe(split()).on('data', processLine)
  })
} else {
  process.stdin.pipe(split()).on('data', function (line) {
    processLine(line, options)
    //if (out.output) console.log(out.output)
  })
}

function formatLine (line, opts) {
  let output, discarded
  try {
    data = JSON.parse(line)
  } catch(err) {
    if (opts.debug) console.error(err)
    return {raw: line}
  }
  let isPassed = opts.filters.every(test => test(data))
  if (isPassed) {
    // return {output: inject(opts.format, data)}
    return {output: opts.formatter(data, opts)}
  } else {
    return {discarded: data}
  }
}

function parseTemplate (tpl) {
  const keys = {}
  const format = tpl.replace(/{(.*?)}/g, (x, arg) => {
    // TODO process REST key
    console.log('key: x: %s, arg:', x, arg)
    let [key, args] = arg.split(/\s(.+)/)
    const parsed = minimist(parseArgsStringToArgv(args), {
      string: ['f', 'l', 'w'],
      default: {'c': false},
      alias: {
        c: 'color',
        i: 'include',
        e: 'exclude',
        f: 'filter',
        w: 'width',
        l: 'level'
      }
    })
    if (parsed.width) parsed.width = parseInt(parsed.width)
    if (parsed.include) parsed.include = parsed.include.split(',')
    if (parsed.exclude) parsed.exclude = parsed.exclude.split(',')
    if (parsed.colors) parsed.colors = parsed.colors.split(',')
      .reduce( (grp, pair) => {
        let [key, val] = pair.split(':')
        grp[key] = val
        return grp
      },{})
    keys[key] = parsed
    return `{${key}}`
  })
  return [format, keys]
}

function setColorFunc (options) {
  ld.forEach(options.keys, (args, key) => {
    let renderColor = (str) => str;
    if (!args.color) {
      if (key === 'REST') {
        let excludeKeys = ld.remove(ld.keys(options.keys), val => val !== 'REST')
        let moreKeys
        if (args['exclude-keys']) {
          moreKeys = args['exclude-keys'].split(',')
          excludeKeys = [...excludeKeys, ...moreKeys]
        }
        renderColor = (str, json) => {
          return JSON.stringify(ld.omit(json, excludeKeys))
        }
      } else {
        renderColor = (str) => str;
      }
    } else {
      if (args.values) {
        // TODO how to create function for each value
        // also if colors are given then
        let valuesColorMap = args.values.reduce( (map, val) => {
          let hexColor = getRandomColor(val)
          map[val] = chalk.bold.hex(hexColor)
          return map
        }, {})
        renderColor = (str) => {
          return valuesColorMap[str] ? valuesColorMap[str](str) : str
        }
      } else if (key === options['level-key']) {
        renderColor = (str) => {
          if (defaultLevelsColors[str]) {
            return defaultLevelsColors[str](str)
          } else {
            let hexColor = getRandomColor(str)
            return chalk.hex(hexColor).bold(str)
          }
        }
      } else {
        renderColor = (str) => {
          let hexColor = getRandomColor(str)
          return chalk.hex(hexColor).bold(str)
        }
      }
    }
    if (args.width) {
      if (args.width < 0) {
        args.renderColor = function (str, json) {
          return renderColor('...' + str.substring(str.length + args.width),
            json)
        }
      } else {
        args.renderColor = function (str, json) {
          return renderColor(str.substring(0, args.width - 1) + '...' , json)
        }
      }
    } else {
      args.renderColor = renderColor
    }
  })
}

function setFilterFunc (options) {
  let filters = []
  ld.forEach(options.keys, (args, key) => {
    if (args.filter) {
      let re = new RegExp(args)
      let test = function (json) {
        return re.test(json[key])
      }
      filters.push(test)
    }
    if (args.include) {
      let re = new RegExp('^(' + args.include.join('|') + ')$')
      let test = function (json) {
        return re.test(json[key])
      }
      filters.push(test)
    }
    if (args.exclude) {
      let re = new RegExp('^(' + args.exclude.join('|') + ')$')
      let test = function (json) {
        return !re.test(json[key])
      }
      filters.push(test)
    }
  })
  return filters
}

function processLine (line, options) {
  //console.log('line: ' + line)
  afterEnabled -= 1
  let out = formatLine(line, options)
  if (out.output) {
    if (before.length > 0) {
      console.log('...')
      before.forEach(data => console.log(formatter(data, options)))
    }
    before = []
    console.log(out.output)
    afterEnabled = argv.context
  } else if (argv.context && out.discarded) {
    //console.log('discarded: ' + out.discarded.message)
    if (afterEnabled >= 0) {
      console.log(formatter(out.discarded, options))
      if (afterEnabled === 0) console.log('...')
    } else {
      if (after.length > 0)
      //after.forEach(data => console.log(formatter(data, options)))
      after = []
      before = addBefore(out.discarded, before, argv.context)
    }
  } else if (options.all && out.raw) {
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

// credit https://stackoverflow.com/a/56112700/713573
// let inject = (str, obj) => str.replace(/\${(.*?)}/g, (x,g)=> obj[g]);

function formatter (json, options) {
  return options.format.replace(/{(.*?)}/g, (x,key) => {
    return options.keys[key].renderColor(op.get(json, key, ''), json);
  })
}
