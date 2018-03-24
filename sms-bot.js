'use strict'
const twilio = require('twilio')
const config = require('./config')

const client = new twilio(
  config.twilio_account_sid,
  config.twilio_auth_token,
)

client.messages.create({
  body: 'eyy lmao',
  to: config.my_number,
  from: config.twilio_number,
})
.then(
  (message) => console.log(message.sid)
)
