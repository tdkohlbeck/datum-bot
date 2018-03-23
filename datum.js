'use strict'

function quick_replyify(label_command_pairs) {
  let quick_replies = []
  label_command_pairs.forEach((pair) => {
    quick_replies.push({
      'content_type': 'text',
      'title': pair[0],
      'payload': pair[1],
    })
  })
  return quick_replies
}

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

function format_as_datum_args(message) {
  let re_and = /(\s(and)\s)/gi
  let re_is =  /(\s(is)\s)/gi
  let re_space = /(?<!(is|and))\b\s\b(?!(is|and))/gi
  // ^ only spaces in tag names (not with and/is)

  let datum_args = message
    .toLowerCase()
    .replace(re_space, '_')
    .replace(re_and, ' ')
    .replace(re_is, ':')
    .replace('-', '_')
    .split(' ')
  return datum_args
}

module.exports = {
  quick_replyify: quick_replyify,
  get_tag_quick_replies: get_tag_quick_replies,
  format_as_datum_args: format_as_datum_args,
}
