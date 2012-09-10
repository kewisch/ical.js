suite('icaltime', function() {
  var Time = ICAL.icaltime;
  var Timezone = ICAL.icaltimezone;

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
        var subject = new ICAL.icaltime.fromJSDate(
          date
        );

        assert.equal(
          subject.dayOfWeek(),
          dayOfWeek
        );
      });
    });

  });

  //XXX: Common pattern refactor ?
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


  test('calculations', function() {

    var test_data = [{
      str: '20120101T000000',
      expect_unixtime: 1325376000,
      expect_1s: '20120101T000001',
      expect_1m: '20120101T000100',
      expect_1h: '20120101T010000',
      expect_1d: '20120102T000000',
      expect_1w: '20120108T000000'
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
      cp.addDuration(ICAL.icalduration.fromString('PT1S'));
      assert.equal(cp, data.expect_1s);
      cp.addDuration(ICAL.icalduration.fromString('-PT1S'));
      assert.equal(cp.toString(), dt.toString());

      cp.addDuration(ICAL.icalduration.fromString('PT1M'));
      assert.equal(cp, data.expect_1m);
      cp.addDuration(ICAL.icalduration.fromString('-PT1M'));
      assert.equal(cp.toString(), dt.toString());

      cp.addDuration(ICAL.icalduration.fromString('PT1H'));
      assert.equal(cp, data.expect_1h);
      cp.addDuration(ICAL.icalduration.fromString('-PT1H'));
      assert.equal(cp.toString(), dt.toString());

      cp.addDuration(ICAL.icalduration.fromString('P1D'));
      assert.equal(cp, data.expect_1d);
      cp.addDuration(ICAL.icalduration.fromString('-P1D'));
      assert.equal(cp.toString(), dt.toString());

      cp.addDuration(ICAL.icalduration.fromString('P1W'));
      assert.equal(cp, data.expect_1w);
      cp.addDuration(ICAL.icalduration.fromString('-P1W'));
      assert.equal(cp.toString(), dt.toString());
    }
  });

  test('normalize', function() {
    var f = new Time({
        second: 59,
        minute: 59,
        hour: 23,
        day: 31,
        month: 12,
        year: 2012
    });

    var test_data = [{
        str: '20121231T235959',
        add_seconds: 1,
        expect: '20130101T000000'
    }, {
        str: '20110101T000000',
        add_seconds: -1,
        expect: '20101231T235959'
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
      str: '20120101T000000',
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
      start_of_week: '20120101T000000',
      end_of_week: '20120107T000000',
      start_of_month: '20120101',
      end_of_month: '20120131',
      start_of_year: '20120101',
      end_of_year: '20121231',
      start_doy_week: 1,
        week_number: 1,
    }, { /* A date in week number 53 */
      str: '20090101T000000',
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
      start_of_week: '20081228T000000',
      end_of_week: '20090103T000000',
      start_of_month: '20090101',
      end_of_month: '20090131',
      start_of_year: '20090101',
      end_of_year: '20091231',
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
      assert.equal(data.start_of_week, dt.start_of_week());
      assert.equal(data.end_of_week, dt.end_of_week());
      assert.equal(data.start_of_month, dt.start_of_month());
      assert.equal(data.end_of_month, dt.end_of_month().toString());
      assert.equal(data.start_of_year, dt.start_of_year());
      assert.equal(data.end_of_year, dt.end_of_year());
      assert.equal(data.start_doy_week, dt.start_doy_week(Time.SUNDAY));
      assert.equal(data.week_number, dt.week_number(Time.SUNDAY));
      // TODO nth_weekday

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
