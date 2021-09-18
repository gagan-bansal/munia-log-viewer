const t = require('tap')
const sinon = require('sinon')

const pretty = require('../lib/pretty.js')

let pj = pretty() // pretty json

t.equal(
  pj({time:123, level: 'info', message: 'foo'}),
  "[123] - info - foo",
  'no options'
)

pj = pretty({template: '{level}: {message}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo'}),
  "info: foo",
  'template as option'
)

pj = pretty({template: '{level -e info}: {message}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo'}),
  false,
  'exclude option'
)

pj = pretty({template: '{level -e info}: {message}'})
t.equal(
  pj({time:123, level: 'debug', message: 'foo'}),
  'debug: foo',
  'not excluded, should print'
)

pj = pretty({template: '{level -i info,debug}: {message}'})
t.equal(
  pj({time:123, level: 'error', message: 'foo'}),
  false,
  'not included, should not print'
)

pj = pretty({template: '{level -i info,debug} - {message}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo'}),
  "info - foo",
  'not included, should not print'
)

pj = pretty({template: '{level} - {message}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo'}),
  "info - foo",
  'not included, should not print'
)

pj = pretty({template: '{level} - {message -f "bar" }'})
t.equal(
  pj({time:123, level: 'info', message: 'foo bar'}),
  "info - foo bar",
  'regex match, should print'
)

pj = pretty({template: '{level} - {message -f "baz" }'})
t.equal(
  pj({time:123, level: 'info', message: 'bar'}),
  false,
  'regex does not match, should not print'
)

pj = pretty({template: '{level} - {message -f /foo/i }'})
t.equal(
  pj({time:123, level: 'info', message: 'FOO bar'}),
  "info - FOO bar",
  'regex match with flags, should print'
)

pj = pretty({template: '{level} - {message -w 3}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo123'}),
  "info - foo...",
  'truncate from start'
)

pj = pretty({template: '{level} - {message -w=-3}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo123'}),
  "info - ...123",
  'truncate backward'
)
