const omit = require('lodash.omit')
const chalkOrg = require('chalk')
const chalk = new chalkOrg.Instance({level: 3});
const getColor = require('./random-color.js')

module.exports = function processLine (line, opts) {
  let output, discarded
  try {
    data = JSON.parse(line)
    if (data) {
      if (opts.levels.indexOf(data.level) > opts.levelIdx) {
        return {discarded: data}
      }
      if (opts.includeLevels) {
        if (opts.includeLevels.indexOf(data.level) < 0) {
          return {discarded: data}
        }
      }
      if (opts.excludeLevels) {
        if (opts.excludeLevels.indexOf(data.level) > -1) {
          return {discarded: data}
        }
      }
      // output = opts.levelsColors[data.level](Object.values(data).join('  '))
      // output = formatter(data, opts)
      debugger
      output = opts.inject(opts.template, data, opts.colorIt)
    }
  } catch(err) {
    if (opts.debug) console.error(err)
    return {raw: line}
  }
  return {output}
}

function formatter (json, opts) {
  let color = opts.levelsColors[json.level]
  if (!color) {
    let hexColor = getColor(json.level)
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

