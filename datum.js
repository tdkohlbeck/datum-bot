'use strict'

const { spawnSync } = require('child_process')

function get_tag_quick_replies(list_only = false) {
  let datum = spawnSync('datum', ['ls', 'tags'])
  let output = datum.stdout.toString()
  if (list_only) {
    return output
  }
  output = output.split('\n')
  output.pop() // remove newline at the end
  let pairs = []
  console.log('output:', output)
  output.forEach((tag) => {
    pairs.push([tag, tag])
  })
  return quick_replyify(pairs)
}

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

function add(array_of_tags) {
  const
    arg_list = ['add'].concat(array_of_tags),
    datum = spawnSync('datum', arg_list)
  return datum.stdout.toString()
}

module.exports = {
  get_tag_quick_replies: get_tag_quick_replies,
  format_as_datum_args: format_as_datum_args,
  add: add,
}
