module.exports = function () {
  return `JSON log viewer (munia log viewer), mlv
  Usage:

  $ lmv <options> [file]
    $ tail -f json.log | mlv
    $ node myapp.js | mlv
    $ mlv json.log
    $ mlv json.log | less -r

  Options:

    -t, --template ..... template to format the json record
                         'some text: {key [options]} or no next {key [options]} {...}'
                         default template '[{time}] - {level [--color]} - {message}'
                         please note: square brackets are required in key options
    -C, --context ...... print number of lines before and after context

    -a, --all .......... print formatted json and non json records if true, default true
                         print only formatted json if false
    -d, --debug ........ print json parse error message, default false
    -h, --help ......... help/usage infromation

  template options:

    -c, --color ........ color the values of this key, default false
    -i, --include ...... include records that have value out of this list
    -e, --exclude ...... exclude records that have value out of this list
    -f, --filter ....... regular expression to filter the record
    -w, --width ........ width of string to be printed
                         if negative then width is considered backward
    --level-key ........ log level key, default 'level',
                         effective only when used with --color option
                         it is useful to select defualt colors for levels

  template special options:

    -l, --level ........ level value, level upto which records to be included,
                         default 'info'
                         --level=info is equivenlent to --include=error,warn,info
                         [Note: option only related to level key]
  special keys:

    REST ............... print rest of the keys and values as JSON string
                         example: -t '{level}: {message} {REST}'
    --include-keys ..... keys to include from 'REST' keys
                         [Note: option only related to 'REST' key]
    --exclude-keys ..... keys to exclude from 'REST' keys
                         [Note: option only related to 'REST' key]
`
  /*
    --colors ........... list of color value mapping
                         --colors=error:red,info:green,debug:brightBlue
   */
}
