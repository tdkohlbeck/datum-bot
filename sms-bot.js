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
  }).then(() => console.log('reminder sent at', Date.now))
}

function hhmm_now() {
  const now = new Date()
  return now.getHours() * 100 + now.getMinutes()
}

const random_times = get_random_times(3, 900, 2100)
console.log(random_times)
let last_time_message_sent
const less_than_a_minute = 1000
setInterval(() => {
  const now = hhmm_now()
  if (
    random_times.includes(now)
    && now != last_time_message_sent
  ){
    console.log('MATCH AT', now)
    last_time_message_sent = now
    send_status_update_msg()
  }
  if (now === parseInt('0000')) // dawn of the second day
    random_times = get_random_times(3, 900, 2100)
}, less_than_a_minute)
// ^ stave off interval drift from missing a minute
// (small chance of missed minute if drift >= 60,001)


function handle_post_request(req, res) {
  console.log('received sms:\n', req.body.Body)
  const
    MessagingResponse = twilio.twiml.MessagingResponse,
    twiml = new MessagingResponse(),
    datum_output = datum.add_msg(req.body.Body)
  console.log('datum added:\n', datum_output)
  twiml.message(datum_output)
  res.writeHead(200, {'Content-Type': 'text/xml'})
  res.end(twiml.toString())
}

module.exports = {
  handle_post_request,
}
