'use strict'

const twilio = require('twilio')
const
  datum = require('./datum'),
  config = require('./config')

/*const client = new twilio(
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
)*/

function handle_post_request(req, res) {
  console.log('received sms:', req.body.Body)
  const
    MessagingResponse = twilio.twiml.MessagingResponse,
    twiml = new MessagingResponse(),
    datum_output = datum.add_msg(req.body.Body)
  twiml.message(datum_output)
  res.writeHead(200, {'Content-Type': 'text/xml'})
  res.end(twiml.toString())
}

module.exports = {
  handle_post_request,
}
