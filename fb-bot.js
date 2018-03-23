'use strict'
const
  { spawnSync } = require('child_process'),
  request = require('request')


const {
  quick_replyify,
  get_tag_quick_replies,
  format_as_datum_args,
} = require('./datum')

const config = require('./config')


function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  // Send the HTTP request to the Messenger Platform
  request(
    {
      "uri": "https://graph.facebook.com/v2.6/me/messages",
      "qs": { "access_token": config.fb_page_access_token },
      "method": "POST",
      "json": request_body
    },
    (err, res, body) => {
      if (!err) {
        console.log('message sent!')
      } else {
        console.error("Unable to send message:" + err)
      }
    } // lambda
  ) // request
} // function

const handleMessage = (
  sender_psid,
  received_message
) => {
  const datum_commands = [
    ['add', 'add'],
    ['remove', 'rm'],
    ['list', 'ls'],
    ['help', '--help'],
  ]

  let selection
  if (received_message.quick_reply) {
    selection = received_message.quick_reply.payload
  // if we are sent a sticker
  } else if (received_message.sticker_id) {
    selection = 'I don\'t understand stickers...'
  } else {
    selection = format_as_datum_args(
      received_message.text
    )
    let args = ['add'].concat(selection)
    let datum = spawnSync('datum', args )
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

  // Create the payload for a basic text message
  let response_message = {
    "text": output,
    "quick_replies": quick_replies,
  }

  // Sends the response message
  callSendAPI(sender_psid, response_message)
}

module.exports = {
  handleMessage: handleMessage
}
