'use strict'

const twilio = require('twilio')
const
  datum = require('./datum'),
  config = require('./config'),
  get_random_times = require('./get-random-times')

const client = new twilio(
  config.twilio_account_sid,
  config.twilio_auth_token,
)

function send_status_update_msg() {
  client.messages.create({
    body: 'Time for a status update! How you feelin\'?',
    to: config.my_number,
    from: config.twilio_number,
  }).then( message => console.log(message.sid) )
}




const random_times = get_random_times(
  3,
  2341,
  2351,
)
console.log(random_times)
const interval_id = setInterval(() => {
  const
    now = new Date(),
    military_now = now.getHours() * 100 + now.getSeconds()
  if (random_times.includes(military_now)) {
    send_status_update_msg()
  }
  console.log(military_now)
}, 900)


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
