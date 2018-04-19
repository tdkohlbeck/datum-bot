'use strict'

const execFile = require('child_process').execFileSync
const readline = require('readline')


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
  let output = execFile('datum', [cmd].concat(argv))
  return output.toString()
}

function add_msg(spoken_msg) {
  const tags = format_as_datum_args(spoken_msg)
  run('add', tags)
  return tags
}

module.exports = {
  add_msg,
  run,
}
