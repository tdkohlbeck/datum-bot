'use strict'

const spawn = require('child_process').spawn


function format_as_datum_args(spoken_msg) {
  const
    re_and = /(\s(and)\s)/gi,
    re_is =  /(\s(is)\s)/gi,
    re_space = /(?<!(is|and))\b\s\b(?!(is|and))/gi
    // ^ only spaces in tag names (not next to and/is)
  return spoken_msg
    .toLowerCase()
    .replace(re_space, '_')
    .replace(re_and, ' ')
    .replace(re_is, ':')
    .replace('-', '_')
    .split(' ')
}

function run(cmd, argv) {
  const datum = spawn('datum', [cmd].concat(argv))
  return datum.stdout.toString()
}

function add_msg(spoken_msg) {
  const tags = format_as_datum_args(spoken_msg)
  return run('add', tags)
}

module.exports = {
  add_msg,
  run,
}
