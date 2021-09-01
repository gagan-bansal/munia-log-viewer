const omit = require('lodash.omit')

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
      output = serialize(data, opts)
    }
  } catch(err) {
    if (opts.debug) console.error(err)
    return {raw: line}
  }
  return {output}
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

