'use strict'

const
  body_parser = require('body-parser'),
  express = require('express'),
  request = require('request'),
  twilio = require('twilio')
const
  fb_bot = require('./fb-bot'),
  //sms_bot = require('./sms-bot'),
  datum = require('./datum'),
  config = require('./config')

const app = express()
app
  .use(express.static(__dirname + '/public'))
  .use(body_parser.json()) // for fb?
  .use(body_parser.urlencoded({extended: false})) // for sms

app.post('/sms', (req, res) => {
  const MessagingResponse = twilio.twiml.MessagingResponse
  const twiml = new MessagingResponse()
  datum.add(datum.format_as_datum_args(req.body.Body))
  twiml.message('twiml webhook!')
  res.writeHead(200, {'Content-Type': 'text/xml'})
  res.end(twiml.toString())
})

app.post('/webhook', (req, res) => {
  if (req.body.object !== 'page') {
    res.sendStatus(403)
    return
  }
  req.body.entry.forEach( (entry) => {
    let webhook_event = entry.messaging[0]
    let sender_psid = webhook_event.sender.id
    if (webhook_event.message) {
      fb_bot.handle_message(
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
