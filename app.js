'use strict'
const
  body_parser = require('body-parser'),
  app = require('express')().use(body_parser.json()),
  request = require('request')

const fb_bot = require('./fb-bot')
  // sms_bot = require('./sms-bot')


// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {
  console.log(fb_bot)
  // Parse the request body from the POST
  let body = req.body
  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Get the webhook event. entry.messaging is an array, but
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0]
      let sender_psid = webhook_event.sender.id
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        fb_bot.handleMessage(sender_psid, webhook_event.message)
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

app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = PAGE_ACCESS_TOKEN
  let mode = req.query['hub.mode']
  let token = req.query['hub.verify_token']
  let challenge = req.query['hub.challenge']

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED')
      res.status(200).send(challenge)
    } else {
      res.sendStatus(403)
    }
  }
})

app.listen(
  process.env.PORT || 1337,
  () => console.log('webhooks running')
)
