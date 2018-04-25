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
  }).then(() => console.log('status request sent at', hhmm_now()))
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
  time_string = time_string.replace(/_/g, ' ')
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

function get_reminders() {
  const reminder_datums = JSON.parse(
    datum.run('--json', ['ls', 'reminder'])
  )
  let reminders = reminder_datums.map(datum => {
    if (!datum.time) return

    return {
      message: datum.reminder.replace(/_/g, ' '),
      date: yyyymmdd_of(parsed_reminder_time(datum.time)),
      time: hhmm_of(parsed_reminder_time(datum.time)),
    }
  })
  return reminders
}

// TODO add reminder upon receiving text
const less_than_a_minute = 1000 // ms
let last_time_reminder_sent
let reminders = get_reminders()
setInterval(() => {
  if (!reminders.length) return
  reminders.map( reminder => {
    if(
      reminder.date === yyyymmdd_now()
      && reminder.time === hhmm_now()
      && hhmm_now() != last_time_reminder_sent
    ){
      send_reminder(reminder.message)
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
    last_time_message_sent = hhmm_now()
    send_status_update_msg()
  }
}, less_than_a_minute)
// ^ stave off interval drift from missing a minute
// (small chance of missed minute if timer drifts > 60,000)


function handle_post_request(req, res) {
  console.log('received sms:\n', req.body.Body)
  const
    MessagingResponse = twilio.twiml.MessagingResponse,
    twiml = new MessagingResponse(),
    datum_output = datum.add_msg(req.body.Body)
  console.log('datum added:\n', datum.format_as_datum_args(req.body.Body))
  if (req.body.Body.toLowerCase().includes('reminder')) {
    console.log('new reminder added')
    reminders = get_reminders()
  }
  twiml.message(datum_output)
  res.writeHead(200, {'Content-Type': 'text/xml'})
  res.end(twiml.toString())
}

module.exports = {
  handle_post_request,
}
