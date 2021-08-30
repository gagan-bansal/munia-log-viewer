const omit = require('lodash.omit')

module.exports = function processLine (line, opts) {
  let output, discarded
  try {
    data = JSON.parse(line)
    if (data) {
      if (opts.levels.indexOf(data.level) > opts.levelIdx) {
        return {discarded: data}
      }
      // output = opts.levelColors[data.level](Object.values(data).join('  '))
      output = serialize(data, opts)
    }
  } catch(err) {
    if (opts.debug) console.error(err)
    output = line
  }
  return {output}
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

