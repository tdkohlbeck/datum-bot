'use strict'

const twilio = require('twilio')
const chrono = require('chrono-node')
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

function hhmm_of(datetime) {
  const date = new Date(datetime)
  return date.getHours() * 100 + date.getMinutes()
}

function yyyymmdd_now() {
  const now = new Date()
  return now.getFullYear() * 1e4
    + (now.getMonth() + 1) * 100
    + now.getDate()
}

function yyyymmdd_of(datetime) {
  const date = new Date(datetime)
  return date.getFullYear() * 1e4
    + (date.getMonth() + 1) * 100
    + date.getDate()
}

function parsed_reminder_time(time_string) {
  time_string = new Date(chrono.parseDate(time_string))
  return time_string.toLocaleString()
}

function send_reminder(reminder) {
  client.messages.create({
    body: reminder,
    to: config.my_number,
    from: config.twilio_number,
  }).then(() => console.log('reminder sent at', hhmm_now()))
}

const less_than_a_minute = 30000 // ms

const reminder_datums = JSON.parse(
  datum.run('--json', ['ls', 'reminder'])
)

let reminders = reminder_datums.map(datum => {
  return {
    message: datum.reminder,
    date: yyyymmdd_of(parsed_reminder_time(datum.time)),
    time: hhmm_of(parsed_reminder_time(datum.time)),
  }
})

// TODO add reminder upon receiving text
let last_time_reminder_sent
setInterval(() => {
  reminders.map( reminder => {
    if(
      reminder.date === yyyymmdd_now()
      && reminder.time === hhmm_now()
      && hhmm_now() != last_time_reminder_sent
    ){
      send_reminder(reminder.message)
      console.log(
        'reminder',
        '\"' + reminder.message + '\"',
        'sent at', hhmm_now()
      )
      last_time_reminder_sent = hhmm_now()
    }
  })
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
