module.exports = function () {
  return `JSON log viewer (munia log viewer), mlv
  Usage:

  $ lmv <options> [file]
    $ tail -f json.log | mlv
    $ node myapp.js | mlv
    $ mlv -i json.log
    $ mlv -i json.log | less -r

  Options:

    -i, --input ........ input file path
    -t, --template ..... template to format the json record
                         'some text: {key [options]} or no next {key [options]} {...}'
                         default template '[{time}] {level [--color]}: {message}'
                         please note: square brackets are required in key options
    -C, --context ...... print number of lines before and after context

    -a, --all .......... print formatted json and non json records if true, default true
                         print only formatted json if false 
    -d, --debug ........ print error message in this program
    -h, --help ......... help/usage infromation

    --level-key ........ log level key, default 'level', option only related to level key
  
  template options:

    -c, --color ........ color the values of this key, default false
    --colors ........... list of color value mapping
                         --colors=error:red,info:green,debug:brightBlue
    -i, --include ...... include records that have value out of this list
    -e, --exclude ...... exclude records that have value out of this list
    -f, --filter ....... regular expression to filter the record
    -w, --width ........ width of string to be printed
                         if negative then width is considered backward

  template specific options:

    -l, --level ........ level value, [Note: option only related to level key]
                         level upto which records to be included, default 'info'
    --include-keys ..... keys to include from 'REST' keys
                         [Note: option only related to 'REST' key]
    --exclude-keys ..... keys to exclude from 'REST' keys
                         [Note: option only related to 'REST' key]
`
}
