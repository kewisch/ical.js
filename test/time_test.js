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
    assert.equal(g, Time.epochTime.toString());
  });

  suite('initialize', function() {
    var icsData;
    testSupport.defineSample('timezones/America/New_York.ics', function(data) {
      icsData = data;
    });

    test('with timezone', function() {
      var parsed = ICAL.parse(icsData);
      var vcalendar = new ICAL.Component(parsed);
      var vtimezone = vcalendar.getFirstSubcomponent('vtimezone');
      var tzid = vtimezone.getFirstPropertyValue('tzid');

      ICAL.TimezoneService.register(vtimezone);

      // utc -5
      var time = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 10,
        timezone: tzid
      });

      // -5
      assert.equal((time.utcOffset() / 60) / 60, -5);

      assert.equal(
        time.toUnixTime(),
        Date.UTC(2012, 0, 1, 15) / 1000
      );
    });
  });

  suite('.icaltime', function() {
    function verify(time, type) {
      test('convert time ' + JSON.stringify(time), function() {
        assert.equal(
          (new ICAL.Time(time)).icaltype,
          type
        );
      });
    }

    verify({ year: 2013, month: 1, day: 1 }, 'date');
    verify(
      { year: 2013, month: 1, day: 1, hour: 3, isDate: true },
      'date'
    );

    verify(
      { year: 2013, month: 1, day: 1, hour: 22 },
      'date-time'
    );

    verify(
      { year: 2013, isDate: false },
      'date-time'
    );

    test('converting types during runtime', function() {
      var time = new ICAL.Time({
        year: 2013, isDate: false
      });

      time.isDate = true;
      assert.equal(time.icaltype, 'date');
    });
  });

  suite('setters', function() {
    var subject;

    setup(function() {
      subject = new ICAL.Time({
        year: 2012,
        month: 12,
        day: 31,
        // needed otherwise this object
        // is treated as a date rather then
        // date-time and hour/minute/second will
        // not be normalized/adjusted.
        hour: 0
      });

      subject.debug = true;
    });

    function movedToNextYear() {
      assert.equal(subject.day, 1);
      assert.equal(subject.month, 1);
      assert.equal(subject.year, 2013);
    }

    test('.month / .day beyond the year', function() {
      subject.day++;
      subject.month++;

      assert.equal(subject.day, 1);
      assert.equal(subject.month, 2);
      assert.equal(subject.year, 2013);
    });

    test('.hour', function() {
      subject.hour = 23;
      subject.hour++;

      movedToNextYear();
      assert.equal(subject.hour, 0);
    });

    test('.minute', function() {
      subject.minute = 59;
      subject.hour = 23;
      subject.minute++;

      movedToNextYear();
      assert.equal(subject.hour, 0);
      assert.equal(subject.minute, 0);
    });

    test('.second', function() {
      subject.hour = 23;
      subject.minute = 59;
      subject.second = 59;

      subject.second++;

      movedToNextYear();
      assert.equal(subject.minute, 0);
      assert.equal(subject.second, 0);
    });

  });

  suite('#subtractDate and #subtractDateTz', function() {
    testSupport.useTimezones('America/Los_Angeles', 'America/New_York');

    test('diff between two times in different timezones', function() {
      // 3 hours ahead of west
      var east = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 10,
        minute: 20,
        timezone: 'America/New_York'
      });


      var west = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 12,
        minute: 50,
        timezone: 'America/Los_Angeles'
      });

      var diff1 = west.subtractDate(east);
      assert.hasProperties(diff1, {
        hours: 2,
        minutes: 30,
        isNegative: false
      });
      var diff2 = west.subtractDateTz(east);
      assert.hasProperties(diff2, {
        hours: 5,
        minutes: 30,
        isNegative: false
      });
    });

    test('diff between two times in same timezone', function() {
      var t1 = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 21,
        minute: 50,
        timezone: 'America/Los_Angeles'
      });
      var t2 = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 8,
        minute: 30,
        timezone: 'America/Los_Angeles'
      });

      var diff1 = t1.subtractDate(t2);
      assert.hasProperties(diff1, {
        hours: 13,
        minutes: 20,
        isNegative: false
      });

      var diff2 = t1.subtractDateTz(t2);
      assert.hasProperties(diff2, {
        hours: 13,
        minutes: 20,
        isNegative: false
      });
    });
    test('negative absolute difference', function() {
      var t1 = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 8,
        minute: 30,
        timezone: 'America/Los_Angeles'
      });
      var t2 = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 21,
        minute: 50,
        timezone: 'America/Los_Angeles'
      });

      var diff = t1.subtractDate(t2);

      assert.hasProperties(diff, {
        hours: 13,
        minutes: 20,
        isNegative: true
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
        zone: Timezone.utcTimezone
      });
    });

    test('floating timezone', function() {
      var subject = Time.fromData({
        year: 2012,
        timezone: 'floating'
      });

      assert.hasProperties(subject, {
        year: 2012,
        zone: Timezone.localTimezone
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
      test('last saturday in Sept 2012 (before current day)', function() {
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

  suite('#toUnixTime', function() {
    test('without timezone', function() {
      var date = new Date(2012, 0, 22, 1, 7, 39);
      var time = new ICAL.Time({
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds()
      });

      assert.equal(
        time.toUnixTime(),
        date.valueOf() / 1000
      );
    });

    suite('with timezone', function() {
      var icsData;
      testSupport.defineSample(
        'timezones/America/Los_Angeles.ics',
        function(data) {

        icsData = data;
      });

      var subject;
      var zone;

      setup(function() {
        var parsed = ICAL.parse(icsData);
        var vcalendar = new ICAL.Component(parsed);
        var comp = vcalendar.getFirstSubcomponent('vtimezone');

        zone = new ICAL.Timezone({
          tzid: comp.getFirstPropertyValue('tzid'),
          component: comp
        });

        subject = new ICAL.Time({
          year: 2012,
          month: 1,
          day: 1,
          hour: 10
        }, zone);
      });

      test('result', function() {
        // we know that subject is -8
        var expectedTime = Date.UTC(
          2012,
          0,
          1,
          18
        ) / 1000;

        assert.equal(
          subject.toUnixTime(),
          expectedTime
        );
      });
    });
  });

  test('#fromUnixTime', function() {
    var time = new ICAL.Time({
      year: 2012,
      month: 1,
      day: 5,
      month: 1,
      hour: 8,
      timezone: 'Z'
    });

    var otherTime = new ICAL.Time();
    otherTime.fromUnixTime(time.toUnixTime());

    assert.deepEqual(
      time.toJSDate(),
      otherTime.toJSDate()
    );
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

  suite('#startDoyWeek', function() {

    test('forward (using defaults)', function() {
      var subject = Time.fromData({ year: 2012, month: 1, day: 20 });
      var result = subject.startDoyWeek();
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
        zone: Timezone.utcTimezone
      });

      var after = new Time(time.toJSON());
      assert.equal(after.zone, Timezone.utcTimezone);

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
        zone: Timezone.localTimezone
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
      assert.equal(after.zone, Timezone.localTimezone);

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
      var dur = dt.subtractDate(Time.epochTime);
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
      endOfWeek: '2012-01-07T00:00:00',
      startOfMonth: '2012-01-01',
      endOfMonth: '2012-01-31',
      startOfYear: '2012-01-01',
      endOfYear: '2012-12-31',
      startDoyWeek: 1,
        weekNumber: 1
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
      endOfWeek: '2009-01-03T00:00:00',
      startOfMonth: '2009-01-01',
      endOfMonth: '2009-01-31',
      startOfYear: '2009-01-01',
      endOfYear: '2009-12-31',
      startDoyWeek: -3,
      weekNumber: 53
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
      assert.equal(data.endOfWeek, dt.endOfWeek());
      assert.equal(data.startOfMonth, dt.startOfMonth());
      assert.equal(data.endOfMonth, dt.endOfMonth().toString());
      assert.equal(data.startOfYear, dt.startOfYear());
      assert.equal(data.endOfYear, dt.endOfYear());
      assert.equal(data.startDoyWeek, dt.startDoyWeek(Time.SUNDAY));
      assert.equal(data.weekNumber, dt.weekNumber(Time.SUNDAY));
      // TODO nthWeekDay

      dt = new Time();
      dt.resetTo(data.year, data.month, data.day, data.hour, data.minute,
                 data.second, Timezone.utcTimezone);
      assert.equal(data.year, dt.year);
      assert.equal(data.month, dt.month);
      assert.equal(data.day, dt.day);
      assert.equal(data.hour, dt.hour);
      assert.equal(data.minute, dt.minute);
      assert.equal(data.second, dt.second);
    }
  });

});
