suite('icaltime', function() {
  var Time = ICAL.Time;
  var Timezone = ICAL.Timezone;

  test('round trip', function() {
    var f = new Time({
      second: 1,
      minute: 2,
      hour: 3,
      day: 4,
      month: 5,
      year: 6007
    });

    var g = f.clone();
    g.fromJSDate(f.toJSDate());
    assert.equal(f.toString(), g.toString());
    // TODO also check UTC dates

    g.reset();
    assert.equal(g, Time.epoch_time.toString());
  });

  suite('setters', function() {

    suite('.day', function() {
      test('beyond month', function() {
        var subject = Time.fromData({ year: 2012, month: 1, day: 31 });
        var result = subject.day += 1;

        assert.equal(result, 32, 'should return real day math');

        assert.equal(subject.month, 2, 'normalizes month');
        assert.equal(subject.day, 1, 'normalizes day');
      });
    });

  });

  suite('#fromJSDate', function() {

    test('utc', function() {
      var date = new Date(2012, 0, 1);
      var expected = {
        year: date.getUTCFullYear(),
        // + 1 ICAL.js is not zero based...
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds()
      };

      var subject = Time.fromJSDate(date, true);

      assert.hasProperties(
        subject, expected
      );
    });

    test('floating', function() {
      var date = new Date(2012, 0, 1);
      var subject = new Time.fromJSDate(date);

      assert.deepEqual(
        subject.toJSDate(),
        date
      );
    });
  });

  suite('#fromData', function() {
    test('empty object', function() {
      var subject = Time.fromData();
      var expected = {
        year: 0,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0
      };

      assert.hasProperties(subject, expected, 'starts at begining of time');
    });

    test('with year, month', function() {
      var subject = Time.fromData({
        year: 2012,
        month: 1
      });

      assert.hasProperties(subject, {
        year: 2012,
        month: 1
      });
    });

    test('utc timezone', function() {
      var subject = Time.fromData({
        year: 2012,
        timezone: 'Z'
      });

      assert.hasProperties(subject, {
        year: 2012,
        zone: Timezone.utc_timezone
      });
    });

    test('floating timezone', function() {
      var subject = Time.fromData({
        year: 2012,
        timezone: 'floating'
      });

      assert.hasProperties(subject, {
        year: 2012,
        zone: Timezone.local_timezone
      });
    });
  });

  suite('#dayOfWeek', function() {

    // format for dayOfWeek assertion
    // is [dayNumber, dateObject]
    var assertions = [
      [Time.SUNDAY, new Date(2012, 0, 1)],
      [Time.MONDAY, new Date(2012, 0, 2)],
      [Time.TUESDAY, new Date(2012, 0, 3)],
      [Time.WEDNESDAY, new Date(2012, 0, 4)],
      [Time.THURSDAY, new Date(2012, 0, 5)],
      [Time.FRIDAY, new Date(2012, 0, 6)],
      [Time.SATURDAY, new Date(2012, 0, 7)]
      //TODO: Add more I was lazy here this is
      //      mostly to check that the function is
      //      sane but if there is a bug somewhere
      //      we can add tests above...
    ];

    assertions.forEach(function(item) {
      var dayOfWeek = item[0];
      var date = item[1];
      var human = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
      var msg = human + ' should be #' + dayOfWeek + ' day';

      test(msg, function() {
        var subject = new ICAL.Time.fromJSDate(
          date
        );

        assert.equal(
          subject.dayOfWeek(),
          dayOfWeek
        );
      });
    });

  });

  suite('#dayOfYear', function() {
    var inc;

    function testYear(start) {
      var end = new Date(
        start.getFullYear() + 1,
        start.getMonth(),
        start.getDate()
      );

      var max = 400;
      var cur = start;
      var date = new Date();
      inc = 1;
      var time = Time.fromJSDate(cur);

      end = new Date(
        end.getFullYear(),
        end.getMonth(),
        0
      );

      while (end.valueOf() >= cur.valueOf()) {
        if (inc > max) {
          throw new Error('test error inf loop');
          break;
        }

        assert.equal(
          time.dayOfYear(),
          inc,
          cur.toString()
        );

        cur = new Date(
          start.getFullYear(),
          0,
          start.getDate() + inc
        );
        time = Time.fromJSDate(cur);
        inc++;
      }
    }

    test('full year (2011/no leap)', function() {
      testYear(new Date(2011, 0, 1));
      assert.equal(inc - 1, 365, 'is not leap');
    });

    test('full year (2012 + leap)', function() {
      testYear(new Date(2012, 0, 1));
      assert.equal(inc - 1, 366, 'is leap');
    });
  });

  suite('#startOfWeek', function() {
    var start = new Date(2012, 1, 1);
    var subject;
    var expected;

    suiteSetup(function() {
      var time = Time.fromJSDate(new Date(
        2012, 0, 29
      ));

      expected = {
        year: time.year,
        month: time.month,
        day: time.day,
        minute: time.minute,
        second: time.second
      };

    });

    var day = 0;
    var max = 4;

    for (; day < max; day++) {
      // scope hack
      (function(day) {
        var date = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + day
        );

        var msg = 'convert: "' + date.toString() + '" to first day of week';

        test(msg, function() {
          subject = Time.fromJSDate(date);
          assert.hasProperties(
            subject.startOfWeek(),
            expected
          );
        });
      }(day));
    }

  });

  suite('#nthWeekDay', function() {
    suite('negative', function() {
      test('last saturday in Sept 2012 (target before current day)', function() {
        var time = Time.fromData({ year: 2012, month: 9, day: 1 });

        var day = time.nthWeekDay(Time.SATURDAY, -1);
        var date = new Date(2012, 8, day);

        assert.deepEqual(
          date,
          new Date(2012, 8, 29)
        );
      });

      test('last Monday in Jan 2012 (target after current day)', function() {
        var time = Time.fromData({ year: 2012, month: 1, day: 1 });

        var day = time.nthWeekDay(Time.MONDAY, -1);
        var date = new Date(2012, 0, day);

        assert.deepEqual(
          new Date(2012, 0, 30),
          date
        );
      });

      test('2nd to last friday after May 15th 2012 (multiple weeks)', function() {
        var time = Time.fromData({ year: 2012, month: 5, day: 15 });

        var day = time.nthWeekDay(Time.FRIDAY, -2);
        var date = new Date(2012, 4, day);

        assert.deepEqual(
          date,
          new Date(2012, 4, 18)
        );
      });

      test('third to last Tuesday in April 2012 (tuesday)', function() {
        var time = Time.fromData({ year: 2012, month: 4, day: 5 });

        var day = time.nthWeekDay(Time.TUESDAY, -3);
        var date = new Date(2012, 3, day);

        assert.deepEqual(
          date,
          new Date(2012, 3, 10)
        );
      });

    });

    suite('positive', function() {

      test('1st wed in Feb 2012 (start is day)', function() {
        var time = Time.fromData({ year: 2012, month: 2, day: 1 });
        var day = time.nthWeekDay(Time.WEDNESDAY, 0);

        var date = new Date(2012, 1, day);
        assert.deepEqual(
          date,
          new Date(2012, 1, 1)
        );
      });

      test('1st monday in Feb 2012 (start is after day)', function() {
        var time = Time.fromData({ year: 2012, month: 2, day: 1 });
        var day = time.nthWeekDay(Time.MONDAY, 0);

        var date = new Date(2012, 1, day);

        assert.deepEqual(
          date,
          new Date(2012, 1, 6)
        );
      });

      test('20th monday of year (multiple months)', function() {
        var time = Time.fromData({ year: 2012, month: 1, day: 1 });

        var day = time.nthWeekDay(Time.MONDAY, 20);
        var date = new Date(2012, 0, day);

        assert.deepEqual(
          date,
          new Date(2012, 4, 14)
        );
      });

      test('3rd monday (multiple)', function() {
        var time = Time.fromData({ year: 2012, month: 1, day: 1 });

        var day = time.nthWeekDay(Time.MONDAY, 3);
        var date = new Date(2012, 0, day);

        assert.deepEqual(
          date,
          new Date(2012, 0, 16)
        );
      });
    });
  });

  suite('#isNthWeekDay', function() {

    test('each day of the week', function() {
      // Remember 1 === SUNDAY not MONDAY
      var start = new Date(2012, 3, 8);
      var time;

      for (var dow = 1; dow <= 7; dow++) {
        time = Time.fromJSDate(new Date(
          start.getFullYear(),
          start.getMonth(),
          7 + dow //8, 9, etc..
        ));

        assert.isTrue(
          time.isNthWeekDay(dow, 2, 31),
          time.toJSDate().toString() +
          ' should be 2nd occurrence of ' + dow + ' weekday'
        );
      }
    });

  });

  suite('#adjust', function() {
    var date = new Date(2012, 0, 25);

    test('overflow days - negative', function() {
      var time = Time.fromJSDate(date);
      time.adjust(-35, 0, 0, 0);

      assert.deepEqual(
        time.toJSDate(),
        new Date(2011, 11, 21)
      );
    });

    test('overflow days - positive', function() {
      var time = Time.fromJSDate(date);

      time.adjust(20, 0, 0, 0);

      assert.deepEqual(
        time.toJSDate(),
        new Date(2012, 1, 14)
      );
    });
  });

  suite('#start_doy_week', function() {

    test('forward (using defaults)', function() {
      var subject = Time.fromData({ year: 2012, month: 1, day: 20 });
      var result = subject.start_doy_week();
      assert.equal(result, 15, 'should start on sunday of that week');
    });

  });

  suite('#toString', function() {
    test('from fractional seconds', function() {
      var subject = new ICAL.Time({
        year: 2012,
        month: 10,
        day: 10,
        minute: 50,
        // I found this while testing in gaia
        second: 8.3,
        isDate: false
      });

      assert.equal(
        subject.toString(),
        '2012-10-10T00:50:08'
      );
    });
  });

  suite('#toICALString', function() {
    test('date', function() {
      var subject = ICAL.Time.fromString('2012-10-12');
      assert.equal(subject.toICALString(), '20121012');
    });

    test('date-time', function() {
      var subject = ICAL.Time.fromString('2012-10-12T07:08:09');
      assert.equal(subject.toICALString(), '20121012T070809');
    });
  });

  suite('#toJSON', function() {
    test('with utc time', function() {
      var time = new Time({
        year: 2012,
        day: 1,
        month: 1,
        hour: 3,
        zone: Timezone.utc_timezone
      });

      var after = new Time(time.toJSON());
      assert.equal(after.zone, Timezone.utc_timezone);

      assert.deepEqual(
        after.toJSDate(),
        time.toJSDate()
      );
    });

    test('with floating time', function() {
      var time = new Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 2,
        minute: 15,
        second: 1,
        isDate: false,
        zone: Timezone.local_timezone
      });

      var expected = {
        year: 2012,
        month: 1,
        day: 1,
        hour: 2,
        minute: 15,
        second: 1,
        isDate: false,
        timezone: 'floating'
      };

      assert.deepEqual(time.toJSON(), expected);

      var after = new Time(time.toJSON());
      assert.equal(after.zone, Timezone.local_timezone);

      assert.deepEqual(
        time.toJSDate(),
        after.toJSDate()
      );
    });
  });

  test('calculations', function() {

    var test_data = [{
      str: '2012-01-01T00:00:00',
      expect_unixtime: 1325376000,
      expect_1s: '2012-01-01T00:00:01',
      expect_1m: '2012-01-01T00:01:00',
      expect_1h: '2012-01-01T01:00:00',
      expect_1d: '2012-01-02T00:00:00',
      expect_1w: '2012-01-08T00:00:00'
    }];

    for (var datakey in test_data) {
      var data = test_data[datakey];
      var dt = Time.fromString(data.str);
      var cp = dt.clone();

      assert.equal(dt.toUnixTime(), data.expect_unixtime);
      var dur = dt.subtractDate(Time.epoch_time);
      assert.equal(dur.toSeconds(), data.expect_unixtime);

      cp = dt.clone();
      cp.year += 1;
      var diff = cp.subtractDate(dt);
      var yearseconds = (365 + Time.is_leap_year(dt.year)) * 86400;
      assert.equal(diff.toSeconds(), yearseconds);

      cp = dt.clone();
      cp.year += 2;
      var diff = cp.subtractDate(dt);
      var yearseconds = (365 + Time.is_leap_year(dt.year) + 365 + Time.is_leap_year(dt.year + 1)) * 86400;
      assert.equal(diff.toSeconds(), yearseconds);

      cp = dt.clone();
      cp.year -= 1;
      var diff = cp.subtractDate(dt);
      var yearseconds = (365 + Time.is_leap_year(cp.year)) * 86400;
      assert.equal(diff.toSeconds(), -yearseconds);

      cp = dt.clone();
      cp.second += 3;
      var diff = cp.subtractDate(dt);
      assert.equal(diff.toSeconds(), 3);

      cp = dt.clone();
      cp.addDuration(ICAL.Duration.fromString('PT1S'));
      assert.equal(cp, data.expect_1s);
      cp.addDuration(ICAL.Duration.fromString('-PT1S'));
      assert.equal(cp.toString(), dt.toString());

      cp.addDuration(ICAL.Duration.fromString('PT1M'));
      assert.equal(cp, data.expect_1m);
      cp.addDuration(ICAL.Duration.fromString('-PT1M'));
      assert.equal(cp.toString(), dt.toString());

      cp.addDuration(ICAL.Duration.fromString('PT1H'));
      assert.equal(cp, data.expect_1h);
      cp.addDuration(ICAL.Duration.fromString('-PT1H'));
      assert.equal(cp.toString(), dt.toString());

      cp.addDuration(ICAL.Duration.fromString('P1D'));
      assert.equal(cp, data.expect_1d);
      cp.addDuration(ICAL.Duration.fromString('-P1D'));
      assert.equal(cp.toString(), dt.toString());

      cp.addDuration(ICAL.Duration.fromString('P1W'));
      assert.equal(cp, data.expect_1w);
      cp.addDuration(ICAL.Duration.fromString('-P1W'));
      assert.equal(cp.toString(), dt.toString());
    }
  });

  test('#normalize', function() {
    var f = new Time({
        second: 59,
        minute: 59,
        hour: 23,
        day: 31,
        month: 12,
        year: 2012
    });

    var test_data = [{
        str: '2012-12-31T23:59:59',
        add_seconds: 1,
        expect: '2013-01-01T00:00:00'
    }, {
        str: '2011-01-01T00:00:00',
        add_seconds: -1,
        expect: '2010-12-31T23:59:59'
    }];

    for (var datakey in test_data) {
        var data = test_data[datakey];
        var dt = Time.fromString(data.str);
        var cur_seconds = dt.second;
        var add_seconds = data.add_seconds || 0;

        dt.auto_normalize = false;
        dt.second += add_seconds;
        assert.equal(cur_seconds + add_seconds, dt.second);
        dt.second = cur_seconds;

        dt.auto_normalize = true;
        dt.second += add_seconds;
        assert.equal(dt, data.expect);
    }
  });

  test('date properties', function() {
    var test_data = [{ /* A date where the year starts on sunday */
      str: '2012-01-01T00:00:00',
      isDate: false,
      year: 2012,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      leap_year: true,
      dayOfWeek: Time.SUNDAY,
      dayOfYear: 1,
      startOfWeek: '2012-01-01T00:00:00',
      end_of_week: '2012-01-07T00:00:00',
      start_of_month: '2012-01-01',
      end_of_month: '2012-01-31',
      start_of_year: '2012-01-01',
      end_of_year: '2012-12-31',
      start_doy_week: 1,
        week_number: 1,
    }, { /* A date in week number 53 */
      str: '2009-01-01T00:00:00',
      isDate: false,
      year: 2009,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      leap_year: false,
      dayOfWeek: Time.THURSDAY,
      dayOfYear: 1,
      startOfWeek: '2008-12-28T00:00:00',
      end_of_week: '2009-01-03T00:00:00',
      start_of_month: '2009-01-01',
      end_of_month: '2009-01-31',
      start_of_year: '2009-01-01',
      end_of_year: '2009-12-31',
      start_doy_week: -3,
      week_number: 53
    }];

    for (var datakey in test_data) {
      var data = test_data[datakey];
      var dt = Time.fromString(data.str);
      assert.equal(data.isDate, dt.isDate);
      assert.equal(data.year, dt.year);
      assert.equal(data.month, dt.month);
      assert.equal(data.day, dt.day);
      assert.equal(data.hour, dt.hour);
      assert.equal(data.minute, dt.minute);
      assert.equal(data.second, dt.second);
      assert.equal(data.leap_year, Time.is_leap_year(dt.year));
      assert.equal(data.dayOfWeek, dt.dayOfWeek());
      assert.equal(data.dayOfYear, dt.dayOfYear());
      assert.equal(data.startOfWeek, dt.startOfWeek());
      assert.equal(data.end_of_week, dt.end_of_week());
      assert.equal(data.start_of_month, dt.start_of_month());
      assert.equal(data.end_of_month, dt.end_of_month().toString());
      assert.equal(data.start_of_year, dt.start_of_year());
      assert.equal(data.end_of_year, dt.end_of_year());
      assert.equal(data.start_doy_week, dt.start_doy_week(Time.SUNDAY));
      assert.equal(data.week_number, dt.week_number(Time.SUNDAY));
      // TODO nthWeekDay

      dt = new Time();
      dt.resetTo(data.year, data.month, data.day, data.hour, data.minute,
                 data.second, Timezone.utc_timezone);
      assert.equal(data.year, dt.year);
      assert.equal(data.month, dt.month);
      assert.equal(data.day, dt.day);
      assert.equal(data.hour, dt.hour);
      assert.equal(data.minute, dt.minute);
      assert.equal(data.second, dt.second);
    }
  });

});
