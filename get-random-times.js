function random_gaussian(sample_count = 6) { // 6 ~= std normal
  let
    sum_of_random_numbers = 0,
    i = 0
  for (i; i < sample_count; i++) {
    sum_of_random_numbers += Math.random()
  }
  return sum_of_random_numbers / sample_count
}

function last_two_numbers(some_integer) {
  const the_hundreds = Math.floor(
    some_integer / 100
  ) * 100
  return some_integer - the_hundreds
}

function convert_to_military_time(random_time) {
  if (last_two_numbers(random_time) > 60) {
    const correct_minutes = Math.floor(
      random_gaussian(2) * 60
    )
    random_time = random_time
      - last_two_numbers(random_time)
      + correct_minutes
  }
  return random_time
}

module.exports = function get_random_times(
  count = 3,
  begin_time = 900,
  end_time = 2100,
){
  const
    available_hours = end_time - begin_time, // e.g. 1200
    interval = Math.floor(available_hours / count) // e.g. 400
  let random_times = []
  for (let i = 0; i < count; i++) {
    const interval_begin_time = begin_time + i * interval
    const random_interval = Math.floor(interval * random_gaussian(2))
    random_times.push(convert_to_military_time(
      interval_begin_time + random_interval
    ))
  }
  return random_times
}
