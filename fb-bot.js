'use strict'

const
  { spawnSync } = require('child_process'),
  request = require('request')
const {
  get_tag_quick_replies,
  format_as_datum_args,
} = require('./datum')
const config = require('./config')

function quick_replyify(label_command_pairs) {
  let quick_replies = []
  label_command_pairs.forEach( (pair) => {
    const quick_reply = {
      'content_type': 'text',
      'title': pair[0],
      'payload': pair[1],
    }
    quick_replies.push(quick_reply)
  })
  return quick_replies
}

function call_send_api(
  sender_psid,
  response
){
  const request_body = {
    'recipient': {
      'id': sender_psid,
    },
    'message': response,
  }
  const request_object = {
    'uri': 'https://graph.facebook.com/v2.6/me/messages',
    'qs': {
      'access_token': config.fb_page_access_token,
    },
    'method': 'POST',
    'json': request_body,
  }
  const handle_response = (err, res, body) => {
    if (err) {
      console.log('facebook cannot send message')
      return
    }
    console.log('message sent')
  }
  request(
    request_object,
    handle_response
  )
}

function handle_message(
  sender_psid,
  received_message
){
  const datum_commands = [
    ['add',    'add'   ],
    ['remove', 'rm'    ],
    ['list',   'ls'    ],
    ['help',   '--help'],
  ]
  let selection
  if (received_message.quick_reply) {
    selection = received_message.quick_reply.payload
  } else if (received_message.sticker_id) {
    selection = 'I don\'t understand stickers...'
  } else {
    const args = format_as_datum_args(received_message.text)
    const arg_list = ['add'].concat(args)
    const datum = spawnSync('datum', arg_list)
    selection = datum.stdout.toString()
  }
  let output, quick_replies
  switch (selection) {
    case 'add':
      output = 'Select tag to add:'
      quick_replies = get_tag_quick_replies()
      break
    case 'ls':
      output = get_tag_quick_replies(true)
      quick_replies = quick_replyify(datum_commands)
      break
    case 'rm':
    case '--help':
    default:
      output = selection || 'datum added'
      quick_replies = quick_replyify(datum_commands)
      break
  }
  const response_message = {
    'text': output,
    'quick_replies': quick_replies,
  }
  call_send_api(
    sender_psid,
    response_message
  )
}

module.exports = {
  handle_message: handle_message,
}
