'use strict'

const
  { spawnSync } = require('child_process'),
  request = require('request')
const
  datum = require('./datum'),
  config = require('./config')

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

function get_tag_quick_replies(list_only = false) {
  const output = datum.run('ls', 'tags')
  if (list_only) {
    return output
  }
  output = output.split('\n')
  output.pop() // remove newline at the end
  let pairs = []
  output.forEach((tag) => {
    pairs.push([tag, tag])
  })
  return quick_replyify(pairs)
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
    datum.add_msg(received_message.text)
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

function handle_post_request(req, res) {
  if (req.body.object !== 'page') {
    res.sendStatus(403)
    return
  }
  req.body.entry.forEach( entry => {
    let webhook_event = entry.messaging[0]
    let sender_psid = webhook_event.sender.id
    if (webhook_event.message) {
      console.log(
        'received fb msg:',
        webhook_event.message.text,
      )
      handle_message(
        sender_psid,
        webhook_event.message
      )
    } else if (webhook_event.postback) {
      handlePostback(sender_psid, webhook_event.postback)
    }
    res.status(200).send('EVENT_RECEIVED\n')
  })
}

function handle_get_request(req, res) {
  if (!mode && !token) {
    res.sendStatus(403)
    return
  }
  const
    VERIFY_TOKEN = config.fb_page_access_token,
    mode = req.query['hub.mode'],
    token = req.query['hub.verify_token'],
    challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED')
    res.status(200).send(challenge)
  }
}

module.exports = {
  handle_post_request,
  handle_get_request,
}
