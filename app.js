'use strict'

const
  request = require('request'),
  { spawnSync } = require('child_process'),
  express = require('express'),
  body_parser = require('body-parser'),
  config = require('./config'),
  app = express().use(body_parser.json()),

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

function handleMessage(sender_psid, received_message) {
  let output, quick_replies

  const datum_commands = [
    ['add', 'add'],
    ['remove', 'rm'],
    ['list', 'ls'],
    ['help', '--help'],
  ]

  let test_msg =
    'food and drink and milk is 10 and orange juice is 5'

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
  ) // request call
} // function def

// Sets server port and logs message on success
app.listen(
  process.env.PORT || 1337,
  () => console.log('webhook is listening')
)

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {
  // Parse the request body from the POST
  let body = req.body
  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Get the webhook event. entry.messaging is an array, but
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0]
      // console.log(webhook_event)
      let sender_psid = webhook_event.sender.id
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message)
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback)
      }

    })
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED\n')
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404)
  }
})

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = PAGE_ACCESS_TOKEN
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode']
  let token = req.query['hub.verify_token']
  let challenge = req.query['hub.challenge']
  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED')
      res.status(200).send(challenge)
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403)
    }
  }
})
