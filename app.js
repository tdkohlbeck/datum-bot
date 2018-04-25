'use strict'

const
  body_parser = require('body-parser'),
  express = require('express')
const
  fb_bot = require('./fb-bot'),
  sms_bot = require('./sms-bot')

const app = express()
app
  .use(express.static(__dirname + '/public'))
  .use(body_parser.json()) // for fb?
  .use(body_parser.urlencoded({extended: false})) // for sms

//app.get('/webhook', fb_bot.handle_get_request)
//app.post('/webhook', fb_bot.handle_post_request)

app.post('/sms', sms_bot.handle_post_request)

app.listen(
  process.env.PORT || 7789,
  () => console.log('webhooks running')
)
