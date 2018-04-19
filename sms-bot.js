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
  }).then(() => console.log('reminder sent at', hhmm_now()))
}

function hhmm_now() {
  const now = new Date()
  return now.getHours() * 100 + now.getMinutes()
}

function send_reminder(reminder) {
  client.messages.create({
    body: reminder,
    to: config.my_number,
    from: config.twilio_number,
  }).then(() => console.log('reminder sent at', hhmm_now()))
}

const less_than_a_minute = 1000

let reminders = datum.run('ls', ['stop'])
send_reminder(reminders)

setInterval(() => {
  /*reminders.map( reminder => {
    if( reminder.datetime === yymmddhhmm_now())
      send_reminder(reminder.message)
  })*/
}, less_than_a_minute)

let random_times = get_random_times(3, 900, 2100)
console.log(random_times)
let last_time_message_sent

setInterval(() => {
  if (!random_times || hhmm_now() === parseInt('0000')) { // dawn of the second day
    random_times = get_random_times(3, 900, 2100)
    console.log(random_times)
  }
  if (
    random_times.includes(hhmm_now())
    && hhmm_now() != last_time_message_sent
  ){
    console.log('random status update reminder at', hhmm_now())
    last_time_message_sent = hhmm_now()
    send_status_update_msg()
  }
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
