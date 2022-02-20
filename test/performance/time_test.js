suite('ICAL.Time', function() {

  perfTest('subtract date', function() {
    var time = new ICAL.Time({
      year: 2012,
      month: 1,
      day: 1,
      hour: 10,
      minute: 3
    });

    var time2 = new ICAL.Time({
      year: 2012,
      month: 10,
      day: 1,
      hour: 1,
      minute: 55
    });

    time.subtractDate(time2);
  });

  var dur = new ICAL.Duration({
    days: 3,
    hour: 3,
    minutes: 3
  });

  perfTest('add duration', function() {
    var time = new ICAL.Time({
      year: 2012,
      month: 1,
      day: 32,
      seconds: 1
    });

    time.addDuration(dur);

    // to trigger normalization
    time.year; // eslint-disable-line no-unused-expressions
  });

  perfTest('create and clone time', function() {
    var time = new ICAL.Time({
      year: 2012,
      month: 1,
      day: 32,
      seconds: 1
    });

    if (time.day !== 1) {
      throw new Error('test sanity fails for .day');
    }

    if (time.month !== 2) {
      throw new Error('test sanity fails for .month');
    }

    time.clone();
  });

  var _time = new ICAL.Time({
    year: 2012,
    month: 1,
    day: 32,
    seconds: 1
  });

  perfTest('toUnixTime', function() {
    _time.toUnixTime();
  });

  perfTest('fromUnixTime', function() {
    _time.fromUnixTime(1234567890);
  });

  perfTest('dayOfWeek', function() {
    _time.dayOfWeek();
  });

  perfTest('weekNumber', function() {
    _time.weekNumber();
  });
});
