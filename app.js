'use strict'

const
  body_parser = require('body-parser'),
  app = require('express')().use(body_parser.json()),
  request = require('request')
const
  fb_bot = require('./fb-bot'),
  //sms_bot = require('./sms-bot'),
  config = require('./config')

app.post('/webhook', (req, res) => {
  if (req.body.object !== 'page') {
    res.sendStatus(403)
    return
  }

  req.body.entry.forEach( (entry) => {
    let webhook_event = entry.messaging[0]
    let sender_psid = webhook_event.sender.id
    if (webhook_event.message) {
      fb_bot.handleMessage(
        sender_psid,
        webhook_event.message
      )
    } else if (webhook_event.postback) {
      handlePostback(sender_psid, webhook_event.postback)
    }
    res.status(200).send('EVENT_RECEIVED\n')
  })
})

app.get('/webhook', (req, res) => {
  if (!mode && !token) {
    res.sendStatus(403)
    return
  }

  const
    VERIFY_TOKEN = config.fb_page_access_token
    mode = req.query['hub.mode']
    token = req.query['hub.verify_token']
    challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED')
    res.status(200).send(challenge)
  }
})

app.listen(
  process.env.PORT || 1337,
  () => console.log('webhooks running')
)
