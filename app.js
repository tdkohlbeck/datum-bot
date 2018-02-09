/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Use this project as the starting point for following the
 * Messenger Platform quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

'use strict';

// TODO put in env var, generate new token
const PAGE_ACCESS_TOKEN = 'EAAFXEQpTodABACvOXu0IuQ3S0pRtfB2hsEmWWaqt0i6sZAmdbablQyfZCswYVenyB7wsovax8oFWBZB0ZBX0vmCGYwe4lXQfr2GBUMcmiYg4JSMPRx72gwtOjHeeuNk0oNZBM5oS5AVUCKpJ2K0084RcjfDrXOokMzRlCDTXyHQZDZD';

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}

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

const datum_commands = [
  ['add', 'add'],
  ['remove', 'rm'],
  ['list', 'ls'],
  ['help', '--help'],
]

function handleMessage(sender_psid, received_message) {

  let response, output, quick_replies;

  // Check if the message contains text
  if (received_message.quick_reply && received_message.quick_reply.payload === 'add') {
    let datum = spawnSync('datum', ['ls', 'tags'])
    output = datum.stdout.toString().split('\n')
    output.pop()
    let pairs = []
    output.forEach((tag) => {
      pairs.push([tag, tag])
    })
    quick_replies = quick_replyify(pairs)
    output = 'Input tag:'
  } else if (received_message.quick_reply) {
    let datum = spawnSync('datum', [received_message.quick_reply.payload])
    output = datum.stdout.toString()
    quick_replies = quick_replyify(datum_commands)
  } else {
    output = 'hey there!'
    quick_replies = quick_replyify(datum_commands)
  }


    // Create the payload for a basic text message
    response = {
      "text": output,
      "quick_replies": quick_replies,
    }


  // Sends the response message
  callSendAPI(sender_psid, response);
}

// Imports dependencies and set up http server
const
  request = require('request'),
  { spawnSync } = require('child_process'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);


      let sender_psid = webhook_event.sender.id;

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }

    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED\n');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = PAGE_ACCESS_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {

    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
