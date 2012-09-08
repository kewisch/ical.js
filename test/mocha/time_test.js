testSupport.requireICAL();

suite('icaltime', function() {

  test('round trip', function() {
    var f = new ICAL.icaltime({
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
    assert.equal(g, ICAL.icaltime.epoch_time.toString());
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
      var dt = ICAL.icaltime.fromString(data.str);
      var cp = dt.clone();

      assert.equal(dt.toUnixTime(), data.expect_unixtime);
      var dur = dt.subtractDate(ICAL.icaltime.epoch_time);
      assert.equal(dur.toSeconds(), data.expect_unixtime);

      cp = dt.clone();
      cp.year += 1;
      var diff = cp.subtractDate(dt);
      var yearseconds = (365 + ICAL.icaltime.is_leap_year(dt.year)) * 86400;
      assert.equal(diff.toSeconds(), yearseconds);

      cp = dt.clone();
      cp.year += 2;
      var diff = cp.subtractDate(dt);
      var yearseconds = (365 + ICAL.icaltime.is_leap_year(dt.year) + 365 + ICAL.icaltime.is_leap_year(dt.year + 1)) * 86400;
      assert.equal(diff.toSeconds(), yearseconds);

      cp = dt.clone();
      cp.year -= 1;
      var diff = cp.subtractDate(dt);
      var yearseconds = (365 + ICAL.icaltime.is_leap_year(cp.year)) * 86400;
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
    var f = new ICAL.icaltime({
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
        var dt = ICAL.icaltime.fromString(data.str);
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
      day_of_week: ICAL.icaltime.SUNDAY,
      day_of_year: 1,
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
      day_of_week: ICAL.icaltime.THURSDAY,
      day_of_year: 1,
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
      var dt = ICAL.icaltime.fromString(data.str);
      assert.equal(data.isDate, dt.isDate);
      assert.equal(data.year, dt.year);
      assert.equal(data.month, dt.month);
      assert.equal(data.day, dt.day);
      assert.equal(data.hour, dt.hour);
      assert.equal(data.minute, dt.minute);
      assert.equal(data.second, dt.second);
      assert.equal(data.leap_year, ICAL.icaltime.is_leap_year(dt.year));
      assert.equal(data.day_of_week, dt.day_of_week());
      assert.equal(data.day_of_year, dt.day_of_year());
      assert.equal(data.start_of_week, dt.start_of_week());
      assert.equal(data.end_of_week, dt.end_of_week());
      assert.equal(data.start_of_month, dt.start_of_month());
      assert.equal(data.end_of_month, dt.end_of_month().toString());
      assert.equal(data.start_of_year, dt.start_of_year());
      assert.equal(data.end_of_year, dt.end_of_year());
      assert.equal(data.start_doy_week, dt.start_doy_week(ICAL.icaltime.SUNDAY));
      assert.equal(data.week_number, dt.week_number(ICAL.icaltime.SUNDAY));
      // TODO nth_weekday

      dt = new ICAL.icaltime();
      dt.resetTo(data.year, data.month, data.day, data.hour, data.minute,
                 data.second, ICAL.icaltimezone.utc_timezone);
      assert.equal(data.year, dt.year);
      assert.equal(data.month, dt.month);
      assert.equal(data.day, dt.day);
      assert.equal(data.hour, dt.hour);
      assert.equal(data.minute, dt.minute);
      assert.equal(data.second, dt.second);
    }
  });

});
