module.exports = function () {
  return `JSON log viewer (munia log viewer), mlv
  Usage:
    $ lmv <options>
    $ tail -f json.log | mlv
    $ node myapp.js | mlv
    $ mlv -i json.log
    $ mlv -i json.log | less -r
  Options:
    -h, --help ......... help/usage infromation
    -i, --input ........ input file path
    -l, --level ........ level upto which logs are displayed
    -C, --context ...... print number of lines before and after context
    -a, --alias ........ alias key name, if key in log is different than default
                         eg. --alieas={time:timestamp,hostip:ip}
    -d, --debug ........ print error message in this program
    -f, --include-levels ....... list of levels to display
                         e.g. -f error -f warn or --levels={error, warn}
                         acronyms for levels e=error, w=warn, i=info, h=http, v=verbose, d=debug, s=silly
    -e, --exclude-levels ...... exclude levels from log
  `
  /*
    --exclude, -e ...... exclude keys from log
    --module, -m ....... module prefix
                         e.g. munia:lib:* or munia/lib/*
    --before, -b -B ... print number of lines of leading context
    --after, -a, -A .... print number of lines of trailing context
    --from-time -f ..... from time e.g. -f 2021-07-01T03:00:00Z
    --to-time -t ....... to time e.g. -f 2021-07-03T03:00:00Z

  */
}
