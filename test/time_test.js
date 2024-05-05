suite('icaltime', function() {
  let Time = ICAL.Time;
  let Timezone = ICAL.Timezone;

  test('round trip', function() {
    let f = new Time({
      second: 1,
      minute: 2,
      hour: 3,
      day: 4,
      month: 5,
      year: 6007
    });

    let g = f.clone();
    g.fromJSDate(f.toJSDate());
    assert.equal(f.toString(), g.toString());
    // TODO also check UTC dates

    g.reset();
    assert.equal(g, Time.epochTime.toString());
  });

  suite('initialize', function() {
    let icsData;
    suiteSetup(async function() {
      icsData = await testSupport.loadSample('timezones/America/New_York.ics');
    });

    test('with timezone', function() {
      let parsed = ICAL.parse(icsData);
      let vcalendar = new ICAL.Component(parsed);
      let vtimezone = vcalendar.getFirstSubcomponent('vtimezone');
      let tzid = vtimezone.getFirstPropertyValue('tzid');

      ICAL.TimezoneService.register(vtimezone);

      // utc -5
      let time = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 10,
        timezone: tzid
      });

      // -5
      assert.equal(time.utcOffset() / 3600, -5);

      assert.equal(
        time.toUnixTime(),
        Date.UTC(2012, 0, 1, 15) / 1000
      );

      ICAL.TimezoneService.reset();
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
      let time = new ICAL.Time({
        year: 2013, isDate: false
      });

      time.isDate = true;
      assert.equal(time.icaltype, 'date');
    });
  });

  suite('setters', function() {
    let subject;

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
      let east = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 10,
        minute: 20,
        timezone: 'America/New_York'
      });


      let west = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 12,
        minute: 50,
        timezone: 'America/Los_Angeles'
      });

      let diff1 = west.subtractDate(east);
      assert.hasProperties(diff1, {
        hours: 2,
        minutes: 30,
        isNegative: false
      });
      let diff2 = west.subtractDateTz(east);
      assert.hasProperties(diff2, {
        hours: 5,
        minutes: 30,
        isNegative: false
      });
    });

    test('diff between two times in same timezone', function() {
      let t1 = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 21,
        minute: 50,
        timezone: 'America/Los_Angeles'
      });
      let t2 = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 8,
        minute: 30,
        timezone: 'America/Los_Angeles'
      });

      let diff1 = t1.subtractDate(t2);
      assert.hasProperties(diff1, {
        hours: 13,
        minutes: 20,
        isNegative: false
      });

      let diff2 = t1.subtractDateTz(t2);
      assert.hasProperties(diff2, {
        hours: 13,
        minutes: 20,
        isNegative: false
      });
    });
    test('negative absolute difference', function() {
      let t1 = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 8,
        minute: 30,
        timezone: 'America/Los_Angeles'
      });
      let t2 = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 21,
        minute: 50,
        timezone: 'America/Los_Angeles'
      });

      let diff = t1.subtractDate(t2);

      assert.hasProperties(diff, {
        hours: 13,
        minutes: 20,
        isNegative: true
      });
    });
  });

  suite('#fromJSDate', function() {

    test('utc', function() {
      let date = new Date(2012, 0, 1);
      let expected = {
        year: date.getUTCFullYear(),
        // + 1 ICAL.js is not zero based...
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds()
      };

      let subject = Time.fromJSDate(date, true);

      assert.hasProperties(
        subject, expected
      );
    });

    test('floating', function() {
      let date = new Date(2012, 0, 1);
      let subject = Time.fromJSDate(date);

      assert.deepEqual(
        subject.toJSDate(),
        date
      );
    });

    test('reset', function() {
      let subject = Time.fromJSDate(null);
      let expected = {
        year: 1970,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        isDate: false,
        timezone: "Z"
      };

      assert.hasProperties(
        subject, expected
      );
    });
  });

  suite('#fromData', function() {
    test('empty object', function() {
      let subject = Time.fromData();
      let expected = {
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
      let subject = Time.fromData({
        year: 2012,
        month: 1
      });

      assert.hasProperties(subject, {
        year: 2012,
        month: 1
      });
    });

    test('utc timezone', function() {
      let subject = Time.fromData({
        year: 2012,
        timezone: 'Z'
      });

      assert.hasProperties(subject, {
        year: 2012,
        zone: Timezone.utcTimezone
      });
    });

    test('floating timezone', function() {
      let subject = Time.fromData({
        year: 2012,
        timezone: 'floating'
      });

      assert.hasProperties(subject, {
        year: 2012,
        zone: Timezone.localTimezone
      });
    });

    test('setting icaltype', function() {
      let subject = Time.fromData({
        icaltype: 'date-time',
        year: 2012,
        month: 1
      });

      assert.hasProperties(subject, {
        icaltype: 'date',
        year: 2012,
        month: 1
      });
    });
  });

  suite('#dayOfWeek', function() {

    // format for dayOfWeek assertion
    // is [dayNumber, dateObject]
    let assertions = [
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
      let dayOfWeek = item[0];
      let date = item[1];
      let human = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
      let msg = human + ' should be #' + dayOfWeek + ' day';

      test(msg, function() {
        let subject = ICAL.Time.fromJSDate(
          date
        );

        assert.equal(
          subject.dayOfWeek(),
          dayOfWeek
        );
      });
    });

    let assertionsWithWkst = [
      //wkst, expectedDayofWeek, date
      [Time.SUNDAY, 1, new Date(2012, 0, 1)],
      [Time.SUNDAY, 2, new Date(2012, 0, 2)],
      [Time.SUNDAY, 3, new Date(2012, 0, 3)],
      [Time.SUNDAY, 4, new Date(2012, 0, 4)],
      [Time.SUNDAY, 5, new Date(2012, 0, 5)],
      [Time.SUNDAY, 6, new Date(2012, 0, 6)],
      [Time.SUNDAY, 7, new Date(2012, 0, 7)],
      [Time.MONDAY, 7, new Date(2012, 0, 1)],
      [Time.MONDAY, 1, new Date(2012, 0, 2)],
      [Time.MONDAY, 2, new Date(2012, 0, 3)],
      [Time.MONDAY, 3, new Date(2012, 0, 4)],
      [Time.MONDAY, 4, new Date(2012, 0, 5)],
      [Time.MONDAY, 5, new Date(2012, 0, 6)],
      [Time.MONDAY, 6, new Date(2012, 0, 7)],
      [Time.TUESDAY, 6, new Date(2012, 0, 1)],
      [Time.TUESDAY, 7, new Date(2012, 0, 2)],
      [Time.TUESDAY, 1, new Date(2012, 0, 3)],
      [Time.TUESDAY, 2, new Date(2012, 0, 4)],
      [Time.TUESDAY, 3, new Date(2012, 0, 5)],
      [Time.TUESDAY, 4, new Date(2012, 0, 6)],
      [Time.TUESDAY, 5, new Date(2012, 0, 7)],
      [Time.WEDNESDAY, 5, new Date(2012, 0, 1)],
      [Time.WEDNESDAY, 6, new Date(2012, 0, 2)],
      [Time.WEDNESDAY, 7, new Date(2012, 0, 3)],
      [Time.WEDNESDAY, 1, new Date(2012, 0, 4)],
      [Time.WEDNESDAY, 2, new Date(2012, 0, 5)],
      [Time.WEDNESDAY, 3, new Date(2012, 0, 6)],
      [Time.WEDNESDAY, 4, new Date(2012, 0, 7)],
      [Time.THURSDAY, 4, new Date(2012, 0, 1)],
      [Time.THURSDAY, 5, new Date(2012, 0, 2)],
      [Time.THURSDAY, 6, new Date(2012, 0, 3)],
      [Time.THURSDAY, 7, new Date(2012, 0, 4)],
      [Time.THURSDAY, 1, new Date(2012, 0, 5)],
      [Time.THURSDAY, 2, new Date(2012, 0, 6)],
      [Time.THURSDAY, 3, new Date(2012, 0, 7)],
      [Time.FRIDAY, 3, new Date(2012, 0, 1)],
      [Time.FRIDAY, 4, new Date(2012, 0, 2)],
      [Time.FRIDAY, 5, new Date(2012, 0, 3)],
      [Time.FRIDAY, 6, new Date(2012, 0, 4)],
      [Time.FRIDAY, 7, new Date(2012, 0, 5)],
      [Time.FRIDAY, 1, new Date(2012, 0, 6)],
      [Time.FRIDAY, 2, new Date(2012, 0, 7)],
      [Time.SATURDAY, 2, new Date(2012, 0, 1)],
      [Time.SATURDAY, 3, new Date(2012, 0, 2)],
      [Time.SATURDAY, 4, new Date(2012, 0, 3)],
      [Time.SATURDAY, 5, new Date(2012, 0, 4)],
      [Time.SATURDAY, 6, new Date(2012, 0, 5)],
      [Time.SATURDAY, 7, new Date(2012, 0, 6)],
      [Time.SATURDAY, 1, new Date(2012, 0, 7)]
    ];

    assertionsWithWkst.forEach(function(item) {
      let wkst = item[0];
      let dayOfWeek = item[1];
      let date = item[2];
      let human = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
      let msg = human + ' should be #' + dayOfWeek + ' day';

      test(msg, function() {
        let subject = ICAL.Time.fromJSDate(
          date
        );

        assert.equal(
          subject.dayOfWeek(wkst),
          dayOfWeek
        );
      });
    });
  });

  suite('#dayOfYear', function() {
    let inc;

    function testYear(start) {
      let end = new Date(
        start.getFullYear() + 1,
        start.getMonth(),
        start.getDate()
      );

      let max = 400;
      let cur = start;
      inc = 1;
      let time = Time.fromJSDate(cur);

      end = new Date(
        end.getFullYear(),
        end.getMonth(),
        0
      );

      while (end.valueOf() >= cur.valueOf()) {
        if (inc > max) {
          throw new Error('test error inf loop');
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
    let start = new Date(2012, 1, 1);
    let subject;
    let expected;

    suiteSetup(function() {
      let time = Time.fromJSDate(new Date(
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

    [0, 1, 2, 3].forEach((day) => {
      let date = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + day
      );

      let msg = 'convert: "' + date.toString() + '" to first day of week';

      test(msg, function() {
        subject = Time.fromJSDate(date);
        assert.hasProperties(
          subject.startOfWeek(),
          expected
        );
      });
    });

  });

  suite('#getDominicalLetter', function() {
    test('instance', function() {
      let subject = function(yr) {
        return (new ICAL.Time({ year: yr })).getDominicalLetter();
      };
      assert.equal(subject(1989), "A");
      assert.equal(subject(1990), "G");
      assert.equal(subject(1991), "F");
      assert.equal(subject(1993), "C");
      assert.equal(subject(1994), "B");
      assert.equal(subject(1997), "E");
      assert.equal(subject(1998), "D");

      assert.equal(subject(2000), "BA");
      assert.equal(subject(2004), "DC");
      assert.equal(subject(2008), "FE");
      assert.equal(subject(2012), "AG");
      assert.equal(subject(2016), "CB");
      assert.equal(subject(2020), "ED");
      assert.equal(subject(2024), "GF");

    });
    test('static', function() {
      let subject = ICAL.Time.getDominicalLetter;
      assert.equal(subject(1989), "A");
      assert.equal(subject(1990), "G");
      assert.equal(subject(1991), "F");
      assert.equal(subject(1993), "C");
      assert.equal(subject(1994), "B");
      assert.equal(subject(1997), "E");
      assert.equal(subject(1998), "D");

      assert.equal(subject(2000), "BA");
      assert.equal(subject(2004), "DC");
      assert.equal(subject(2008), "FE");
      assert.equal(subject(2012), "AG");
      assert.equal(subject(2016), "CB");
      assert.equal(subject(2020), "ED");
      assert.equal(subject(2024), "GF");
    });
  });

  suite('#nthWeekDay', function() {
    suite('negative', function() {
      test('last saturday in Sept 2012 (before current day)', function() {
        let time = Time.fromData({ year: 2012, month: 9, day: 1 });

        let day = time.nthWeekDay(Time.SATURDAY, -1);
        let date = new Date(2012, 8, day);

        assert.deepEqual(
          date,
          new Date(2012, 8, 29)
        );
      });

      test('last Monday in Jan 2012 (target after current day)', function() {
        let time = Time.fromData({ year: 2012, month: 1, day: 1 });

        let day = time.nthWeekDay(Time.MONDAY, -1);
        let date = new Date(2012, 0, day);

        assert.deepEqual(
          new Date(2012, 0, 30),
          date
        );
      });

      test('2nd to last friday after May 15th 2012 (multiple weeks)', function() {
        let time = Time.fromData({ year: 2012, month: 5, day: 15 });

        let day = time.nthWeekDay(Time.FRIDAY, -2);
        let date = new Date(2012, 4, day);

        assert.deepEqual(
          date,
          new Date(2012, 4, 18)
        );
      });

      test('third to last Tuesday in April 2012 (tuesday)', function() {
        let time = Time.fromData({ year: 2012, month: 4, day: 5 });

        let day = time.nthWeekDay(Time.TUESDAY, -3);
        let date = new Date(2012, 3, day);

        assert.deepEqual(
          date,
          new Date(2012, 3, 10)
        );
      });

    });

    suite('positive', function() {

      test('1st wed in Feb 2012 (start is day)', function() {
        let time = Time.fromData({ year: 2012, month: 2, day: 1 });
        let day = time.nthWeekDay(Time.WEDNESDAY, 0);

        let date = new Date(2012, 1, day);
        assert.deepEqual(
          date,
          new Date(2012, 1, 1)
        );
      });

      test('1st monday in Feb 2012 (start is after day)', function() {
        let time = Time.fromData({ year: 2012, month: 2, day: 1 });
        let day = time.nthWeekDay(Time.MONDAY, 0);

        let date = new Date(2012, 1, day);

        assert.deepEqual(
          date,
          new Date(2012, 1, 6)
        );
      });

      test('20th monday of year (multiple months)', function() {
        let time = Time.fromData({ year: 2012, month: 1, day: 1 });

        let day = time.nthWeekDay(Time.MONDAY, 20);
        let date = new Date(2012, 0, day);

        assert.deepEqual(
          date,
          new Date(2012, 4, 14)
        );
      });

      test('3rd monday (multiple)', function() {
        let time = Time.fromData({ year: 2012, month: 1, day: 1 });

        let day = time.nthWeekDay(Time.MONDAY, 3);
        let date = new Date(2012, 0, day);

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
      let start = new Date(2012, 3, 8);
      let time;

      for (let dow = 1; dow <= 7; dow++) {
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

    test('on any weekday', function() {
      let dt = Time.fromString('2013-01-08');
      assert.isTrue(dt.isNthWeekDay(Time.TUESDAY, 0));
    });
    test('not weekday at all', function() {
      let dt = Time.fromString('2013-01-08');
      assert.isFalse(dt.isNthWeekDay(Time.WEDNESDAY, 0));
    });
    test('not nth weekday', function() {
      let dt = Time.fromString('2013-01-08');
      assert.isFalse(dt.isNthWeekDay(Time.TUESDAY, 3));
    });

  });

  suite('#toUnixTime', function() {
    test('without timezone', function() {
      let date = new Date(2012, 0, 22, 1, 7, 39);
      let time = new ICAL.Time({
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
      let icsData;
      suiteSetup(async function() {
        icsData = await testSupport.loadSample('timezones/America/Los_Angeles.ics');
      });

      let subject;
      let zone;

      setup(function() {
        let parsed = ICAL.parse(icsData);
        let vcalendar = new ICAL.Component(parsed);
        let comp = vcalendar.getFirstSubcomponent('vtimezone');

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
        let expectedTime = Date.UTC(
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
    let time = new ICAL.Time({
      year: 2012,
      month: 1,
      day: 5,
      hour: 8,
      minute: 4,
      second: 13,
      timezone: 'Z'
    });

    let otherTime = new ICAL.Time();
    otherTime.fromUnixTime(time.toUnixTime());

    assert.deepEqual(
      time.toJSDate(),
      otherTime.toJSDate()
    );

    otherTime.fromUnixTime(time.toUnixTime() + 0.123);

    assert.equal(time.toUnixTime(), otherTime.toUnixTime());
    assert.deepEqual(
      time.toJSDate(),
      otherTime.toJSDate()
    );
    assert.deepEqual(
      time.second,
      otherTime.second
    );

    let date = new ICAL.Time({
      year: 2012,
      month: 1,
      day: 5
    });

    date.fromUnixTime(date.toUnixTime());
    assert.equal(date.hour, 0);
    assert.equal(date.minute, 0);
    assert.equal(date.second, 0);
  });

  suite('#adjust', function() {
    let date = new Date(2012, 0, 25);

    test('overflow days - negative', function() {
      let time = Time.fromJSDate(date);
      time.adjust(-35, 0, 0, 0);

      assert.deepEqual(
        time.toJSDate(),
        new Date(2011, 11, 21)
      );
    });

    test('overflow days - positive', function() {
      let time = Time.fromJSDate(date);

      time.adjust(20, 0, 0, 0);

      assert.deepEqual(
        time.toJSDate(),
        new Date(2012, 1, 14)
      );
    });

    test('overflow years normalization  - negative', function() {
      let time = Time.fromJSDate(date);

      time.month = 0;
      time.adjust(0, 0, 0, 0);

      assert.deepEqual(
        time.toJSDate(),
        new Date(2011, 11, 25)
      );
    });

    test('overflow years normalization  - positive', function() {
      let time = Time.fromJSDate(date);

      time.month = 13;
      time.adjust(0, 0, 0, 0);

      assert.deepEqual(
        time.toJSDate(),
        new Date(2013, 0, 25)
      );
    });

  });

  suite('#startDoyWeek', function() {

    test('forward (using defaults)', function() {
      let subject = Time.fromData({ year: 2012, month: 1, day: 20 });
      let result = subject.startDoyWeek();
      assert.equal(result, 15, 'should start on sunday of that week');
    });
    test('with different wkst', function() {
      let subject = Time.fromData({ year: 2012, month: 1, day: 1 });
      let result = subject.startDoyWeek(ICAL.Time.MONDAY);
      assert.equal(result, -5);
    });
    test('falls on zero', function() {
      let subject = Time.fromData({ year: 2013, month: 1, day: 1 });
      let result = subject.startDoyWeek(ICAL.Time.MONDAY);
      assert.equal(result, 0);
    });
  });

  suite('#toString', function() {
    test('from fractional seconds', function() {
      let subject = new ICAL.Time({
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
      let subject = ICAL.Time.fromString('2012-10-12');
      assert.equal(subject.toICALString(), '20121012');
    });

    test('date-time', function() {
      let subject = ICAL.Time.fromString('2012-10-12T07:08:09');
      assert.equal(subject.toICALString(), '20121012T070809');
    });
  });

  suite('#toJSON', function() {
    test('with utc time', function() {
      let time = new Time({
        year: 2012,
        day: 1,
        month: 1,
        hour: 3,
        zone: Timezone.utcTimezone
      });

      let after = new Time(time.toJSON());
      assert.equal(after.zone, Timezone.utcTimezone);

      assert.deepEqual(
        after.toJSDate(),
        time.toJSDate()
      );
    });

    test('with floating time', function() {
      let time = new Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 2,
        minute: 15,
        second: 1,
        isDate: false,
        zone: Timezone.localTimezone
      });

      let expected = {
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

      let after = new Time(time.toJSON());
      assert.equal(after.zone, Timezone.localTimezone);

      assert.deepEqual(
        time.toJSDate(),
        after.toJSDate()
      );
    });

    test('with null timezone', function() {
      let time = new Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 2,
        minute: 15,
        second: 1,
        isDate: false,
      });
      time.zone = null;

      let expected = {
        year: 2012,
        month: 1,
        day: 1,
        hour: 2,
        minute: 15,
        second: 1,
        isDate: false,
      };

      assert.deepEqual(time.toJSON(), expected);
    });
  });

  test('calculations', function() {

    let test_data = [{
      str: '2012-01-01T00:00:00',
      expect_unixtime: 1325376000,
      expect_1s: '2012-01-01T00:00:01',
      expect_1m: '2012-01-01T00:01:00',
      expect_1h: '2012-01-01T01:00:00',
      expect_1d: '2012-01-02T00:00:00',
      expect_1w: '2012-01-08T00:00:00'
    }];

    for (let datakey in test_data) {
      let data = test_data[datakey];
      let dt = Time.fromString(data.str);
      let cp = dt.clone();

      assert.equal(dt.toUnixTime(), data.expect_unixtime);
      let dur = dt.subtractDate(Time.epochTime);
      assert.equal(dur.toSeconds(), data.expect_unixtime);

      cp = dt.clone();
      cp.year += 1;

      let diff = cp.subtractDate(dt);
      let yearseconds = (365 + Time.isLeapYear(dt.year)) * 86400;
      assert.equal(diff.toSeconds(), yearseconds);

      cp = dt.clone();
      cp.year += 2;
      diff = cp.subtractDate(dt);
      yearseconds = (365 + Time.isLeapYear(dt.year) + 365 + Time.isLeapYear(dt.year + 1)) * 86400;
      assert.equal(diff.toSeconds(), yearseconds);

      cp = dt.clone();
      cp.year -= 1;
      diff = cp.subtractDate(dt);
      yearseconds = (365 + Time.isLeapYear(cp.year)) * 86400;
      assert.equal(diff.toSeconds(), -yearseconds);

      cp = dt.clone();
      cp.second += 3;
      diff = cp.subtractDate(dt);
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


      cp = dt.clone();
      cp.addDuration(ICAL.Duration.fromString('PT24H'));
      cp.isDate = true;

      // force normalize
      // eslint-disable-next-line no-unused-expressions
      cp.isDate;

      cp.isDate = false;
      assert.equal(cp, data.expect_1d);
    }
  });

  test('#normalize', function() {
    let test_data = [{
        str: '2012-12-31T23:59:59',
        add_seconds: 1,
        expect: '2013-01-01T00:00:00'
    }, {
        str: '2011-01-01T00:00:00',
        add_seconds: -1,
        expect: '2010-12-31T23:59:59'
    }];

    for (let datakey in test_data) {
        let data = test_data[datakey];
        let dt = Time.fromString(data.str);
        let add_seconds = data.add_seconds || 0;

        dt.second += add_seconds;
        assert.equal(dt, data.expect);
    }
  });

  suite('date properites', function() {
    function testDateProperties(str, data, only) {
      (only ? test.only : test)(str, function() {
        let dt = Time.fromString(str);
        assert.equal(data.isDate, dt.isDate);
        assert.equal(data.year, dt.year);
        assert.equal(data.month, dt.month);
        assert.equal(data.day, dt.day);
        assert.equal(data.hour, dt.hour);
        assert.equal(data.minute, dt.minute);
        assert.equal(data.second, dt.second);
        assert.equal(data.leap_year, Time.isLeapYear(dt.year));
        assert.equal(data.dayOfWeek, dt.dayOfWeek().toString());
        assert.equal(data.dayOfYear, dt.dayOfYear().toString());
        assert.equal(data.startOfWeek, dt.startOfWeek().toString());
        assert.equal(data.endOfWeek, dt.endOfWeek().toString());
        assert.equal(data.startOfMonth, dt.startOfMonth().toString());
        assert.equal(data.endOfMonth, dt.endOfMonth().toString());
        assert.equal(data.startOfYear, dt.startOfYear().toString());
        assert.equal(data.endOfYear, dt.endOfYear().toString());
        assert.equal(data.startDoyWeek, dt.startDoyWeek(Time.SUNDAY));
        assert.equal(data.weekNumber, dt.weekNumber(Time.SUNDAY));
        assert.equal(data.getDominicalLetter, dt.getDominicalLetter());
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
      });
    }
    testDateProperties.only = function(str, data) {
      testDateProperties(str, data, true);
    };

    // A date where the year starts on sunday
    testDateProperties('2012-01-01T00:00:00', {
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
      startOfWeek: '2012-01-01',
      endOfWeek: '2012-01-07',
      startOfMonth: '2012-01-01',
      endOfMonth: '2012-01-31',
      startOfYear: '2012-01-01',
      endOfYear: '2012-12-31',
      startDoyWeek: 1,
      weekNumber: 1,
      getDominicalLetter: 'AG'
    });
    // A date in week number 53
    testDateProperties('2005-01-01T00:00:00', {
      isDate: false,
      year: 2005,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      leap_year: false,
      dayOfWeek: Time.SATURDAY,
      dayOfYear: 1,
      startOfWeek: '2004-12-26',
      endOfWeek: '2005-01-01',
      startOfMonth: '2005-01-01',
      endOfMonth: '2005-01-31',
      startOfYear: '2005-01-01',
      endOfYear: '2005-12-31',
      getDominicalLetter: 'B',
      startDoyWeek: -5,
      weekNumber: 53
    });
    // A time in week number 28
    testDateProperties('2015-07-08T01:02:03', {
      isDate: false,
      year: 2015,
      month: 7,
      day: 8,
      hour: 1,
      minute: 2,
      second: 3,
      leap_year: false,
      dayOfWeek: Time.WEDNESDAY,
      dayOfYear: 189,
      startOfWeek: '2015-07-05',
      endOfWeek: '2015-07-11',
      startOfMonth: '2015-07-01',
      endOfMonth: '2015-07-31',
      startOfYear: '2015-01-01',
      endOfYear: '2015-12-31',
      startDoyWeek: 186,
      getDominicalLetter: 'D',
      weekNumber: 28
    });
  });

  test('startOfWeek with different first day of week', function() {
    let test_data = [{ /* A Sunday */
      str: '2012-01-01T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-01',
          MONDAY: '2011-12-26',
          TUESDAY: '2011-12-27',
          WEDNESDAY: '2011-12-28',
          THURSDAY: '2011-12-29',
          FRIDAY: '2011-12-30',
          SATURDAY: '2011-12-31'
      }
    }, { /* A Monday */
      str: '2012-01-02T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-01',
          MONDAY: '2012-01-02',
          TUESDAY: '2011-12-27',
          WEDNESDAY: '2011-12-28',
          THURSDAY: '2011-12-29',
          FRIDAY: '2011-12-30',
          SATURDAY: '2011-12-31'
      }
    }, { /* A Tuesday */
      str: '2012-01-03T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-01',
          MONDAY: '2012-01-02',
          TUESDAY: '2012-01-03',
          WEDNESDAY: '2011-12-28',
          THURSDAY: '2011-12-29',
          FRIDAY: '2011-12-30',
          SATURDAY: '2011-12-31'
      }
    }, { /* A Wednesday */
      str: '2012-01-04T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-01',
          MONDAY: '2012-01-02',
          TUESDAY: '2012-01-03',
          WEDNESDAY: '2012-01-04',
          THURSDAY: '2011-12-29',
          FRIDAY: '2011-12-30',
          SATURDAY: '2011-12-31'
      }
    }, { /* A Thursday */
      str: '2012-01-05T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-01',
          MONDAY: '2012-01-02',
          TUESDAY: '2012-01-03',
          WEDNESDAY: '2012-01-04',
          THURSDAY: '2012-01-05',
          FRIDAY: '2011-12-30',
          SATURDAY: '2011-12-31'
      }
    }, { /* A Friday */
      str: '2012-01-06T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-01',
          MONDAY: '2012-01-02',
          TUESDAY: '2012-01-03',
          WEDNESDAY: '2012-01-04',
          THURSDAY: '2012-01-05',
          FRIDAY: '2012-01-06',
          SATURDAY: '2011-12-31'
      }
    }, { /* A Saturday */
      str: '2012-01-07T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-01',
          MONDAY: '2012-01-02',
          TUESDAY: '2012-01-03',
          WEDNESDAY: '2012-01-04',
          THURSDAY: '2012-01-05',
          FRIDAY: '2012-01-06',
          SATURDAY: '2012-01-07'
      }
    }];

    for (let datakey in test_data) {
      let data = test_data[datakey];
      let dt = Time.fromString(data.str);
      for (let day in data.firstDayOfWeek) {
          assert.equal(data.firstDayOfWeek[day], dt.startOfWeek(ICAL.Time[day]).toString());
      }
    }
  });

  test('endOfWeek with different first day of week', function() {
    let test_data = [{ /* A Sunday */
      str: '2012-01-01T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-07',
          MONDAY: '2012-01-01',
          TUESDAY: '2012-01-02',
          WEDNESDAY: '2012-01-03',
          THURSDAY: '2012-01-04',
          FRIDAY: '2012-01-05',
          SATURDAY: '2012-01-06'
      }
    }, { /* A Monday */
      str: '2012-01-02T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-07',
          MONDAY: '2012-01-08',
          TUESDAY: '2012-01-02',
          WEDNESDAY: '2012-01-03',
          THURSDAY: '2012-01-04',
          FRIDAY: '2012-01-05',
          SATURDAY: '2012-01-06'
      }
    }, { /* A Tuesday */
      str: '2012-01-03T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-07',
          MONDAY: '2012-01-08',
          TUESDAY: '2012-01-09',
          WEDNESDAY: '2012-01-03',
          THURSDAY: '2012-01-04',
          FRIDAY: '2012-01-05',
          SATURDAY: '2012-01-06'
      }
    }, { /* A Wednesday */
      str: '2012-01-04T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-07',
          MONDAY: '2012-01-08',
          TUESDAY: '2012-01-09',
          WEDNESDAY: '2012-01-10',
          THURSDAY: '2012-01-04',
          FRIDAY: '2012-01-05',
          SATURDAY: '2012-01-06'
      }
    }, { /* A Thursday */
      str: '2012-01-05T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-07',
          MONDAY: '2012-01-08',
          TUESDAY: '2012-01-09',
          WEDNESDAY: '2012-01-10',
          THURSDAY: '2012-01-11',
          FRIDAY: '2012-01-05',
          SATURDAY: '2012-01-06'
      }
    }, { /* A Friday */
      str: '2012-01-06T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-07',
          MONDAY: '2012-01-08',
          TUESDAY: '2012-01-09',
          WEDNESDAY: '2012-01-10',
          THURSDAY: '2012-01-11',
          FRIDAY: '2012-01-12',
          SATURDAY: '2012-01-06'
      }
    }, { /* A Saturday */
      str: '2012-01-07T12:01:00',
      firstDayOfWeek: {
          SUNDAY: '2012-01-07',
          MONDAY: '2012-01-08',
          TUESDAY: '2012-01-09',
          WEDNESDAY: '2012-01-10',
          THURSDAY: '2012-01-11',
          FRIDAY: '2012-01-12',
          SATURDAY: '2012-01-13'
      }
    }];

    for (let datakey in test_data) {
      let data = test_data[datakey];
      let dt = Time.fromString(data.str);
      for (let day in data.firstDayOfWeek) {
          assert.equal(data.firstDayOfWeek[day], dt.endOfWeek(ICAL.Time[day]).toString());
      }
    }
  });

  suite('#compare', function() {
    testSupport.useTimezones('America/New_York', 'America/Los_Angeles');

    test('simple comparison', function() {
      let a = Time.fromString('2001-01-01T00:00:00');
      let b = Time.fromString('2001-01-01T00:00:00');
      assert.equal(a.compare(b), 0);

      b = Time.fromString('2002-01-01T00:00:00');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);

      b = Time.fromString('2001-02-01T00:00:00');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);

      b = Time.fromString('2001-01-02T00:00:00');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);

      b = Time.fromString('2001-01-01T01:00:00');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);

      b = Time.fromString('2001-01-01T00:01:00');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);

      b = Time.fromString('2001-01-01T00:00:01');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);
    });

    test('simple comparison one with a timezone, one without', function() {
      // Floating timezone is effectively UTC. New York is 5 hours behind.
      let a = Time.fromString('2001-01-01T00:00:00');
      a.zone = ICAL.TimezoneService.get('America/New_York');
      let b = Time.fromString('2001-01-01T05:00:00');
      b.zone = Timezone.localTimezone;
      assert.equal(a.compare(b), 0);

      b = Time.fromString('2002-01-01T05:00:00');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);

      b = Time.fromString('2001-02-01T05:00:00');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);

      b = Time.fromString('2001-01-02T05:00:00');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);

      b = Time.fromString('2001-01-01T06:00:00');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);

      b = Time.fromString('2001-01-01T05:01:00');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);

      b = Time.fromString('2001-01-01T05:00:01');
      assert.equal(a.compare(b), -1);
      assert.equal(b.compare(a), 1);
    });

    test('date-only comparison', function() {
      let a = Time.fromString('2001-01-01');
      let b = Time.fromString('2001-01-01');
      assert.equal(a.compareDateOnlyTz(b, Timezone.localTimezone), 0);

      b = Time.fromString('2002-01-01');
      assert.equal(a.compareDateOnlyTz(b, Timezone.localTimezone), -1);
      assert.equal(b.compareDateOnlyTz(a, Timezone.localTimezone), 1);

      b = Time.fromString('2001-02-01');
      assert.equal(a.compareDateOnlyTz(b, Timezone.localTimezone), -1);
      assert.equal(b.compareDateOnlyTz(a, Timezone.localTimezone), 1);

      b = Time.fromString('2001-01-02');
      assert.equal(a.compareDateOnlyTz(b, Timezone.localTimezone), -1);
      assert.equal(b.compareDateOnlyTz(a, Timezone.localTimezone), 1);
    });

    test('both are dates', function() {
      let a = Time.fromString('2014-07-20');
      a.zone = ICAL.TimezoneService.get('America/New_York');
      let b = Time.fromString('2014-07-20');
      b.zone = Timezone.localTimezone;

      assert.ok(a.isDate);
      assert.ok(b.isDate);

      assert.equal(a.compareDateOnlyTz(b, a.zone), 0);
      assert.equal(a.compareDateOnlyTz(b, b.zone), 0);
      assert.equal(b.compareDateOnlyTz(a, a.zone), 0);
      assert.equal(b.compareDateOnlyTz(a, b.zone), 0);

      // Midnight in New York is after midnight UTC.
      assert.equal(a.compare(b), 1);
      assert.equal(b.compare(a), -1);
    });

    test('one is date, one isnt', function() {
      let a = Time.fromString('2014-07-20T12:00:00.000');
      a.zone = ICAL.TimezoneService.get('America/New_York');
      let b = Time.fromString('2014-07-20');
      b.zone = Timezone.localTimezone;

      assert.ok(!a.isDate);
      assert.ok(b.isDate);

      assert.equal(a.compareDateOnlyTz(b, a.zone), 0);
      assert.equal(a.compareDateOnlyTz(b, b.zone), 0);
      assert.equal(b.compareDateOnlyTz(a, a.zone), 0);
      assert.equal(b.compareDateOnlyTz(a, b.zone), 0);

      // Midday in New York is after midnight UTC.
      assert.equal(a.compare(b), 1);
      assert.equal(b.compare(a), -1);
    });

    test('one is date, one isnt', function() {
      let a = Time.fromString('2014-07-20T12:00:00.000');
      a.zone = Timezone.localTimezone;
      let b = Time.fromString('2014-07-20');
      b.zone = ICAL.TimezoneService.get('America/New_York');

      assert.ok(!a.isDate);
      assert.ok(b.isDate);

      assert.equal(a.compareDateOnlyTz(b, a.zone), 0);
      assert.equal(a.compareDateOnlyTz(b, b.zone), 0);
      assert.equal(b.compareDateOnlyTz(a, a.zone), 0);
      assert.equal(b.compareDateOnlyTz(a, b.zone), 0);

      // Midday UTC is after midnight in New York.
      assert.equal(a.compare(b), 1);
      assert.equal(b.compare(a), -1);
    });

    test('both are not dates', function() {
      let a = Time.fromString('2014-07-20T12:00:00.000');
      a.zone = ICAL.TimezoneService.get('America/New_York');
      let b = Time.fromString('2014-07-20T12:00:00.000');
      b.zone = Timezone.localTimezone;

      assert.ok(!a.isDate);
      assert.ok(!b.isDate);

      assert.equal(a.compareDateOnlyTz(b, a.zone), 0);
      assert.equal(a.compareDateOnlyTz(b, b.zone), 0);
      assert.equal(b.compareDateOnlyTz(a, a.zone), 0);
      assert.equal(b.compareDateOnlyTz(a, b.zone), 0);

      // Midday in New York is after midday UTC.
      assert.equal(a.compare(b), 1);
      assert.equal(b.compare(a), -1);
    });

    test('two timezones', function() {
      let a = Time.fromString('2014-07-20T02:00:00.000');
      a.zone = ICAL.TimezoneService.get('America/New_York');
      let b = Time.fromString('2014-07-19T23:00:00.000');
      b.zone = ICAL.TimezoneService.get('America/Los_Angeles');

      assert.ok(!a.isDate);
      assert.ok(!b.isDate);

      assert.equal(a.compareDateOnlyTz(b, a.zone), 0);
      assert.equal(a.compareDateOnlyTz(b, b.zone), 0);
      assert.equal(b.compareDateOnlyTz(a, a.zone), 0);
      assert.equal(b.compareDateOnlyTz(a, b.zone), 0);
      assert.equal(a.compare(b), 0);
      assert.equal(b.compare(a), 0);

      a.isDate = true;
      b.isDate = true;

      assert.equal(a.compareDateOnlyTz(b, a.zone), 1);
      assert.equal(a.compareDateOnlyTz(b, b.zone), 1);
      assert.equal(b.compareDateOnlyTz(a, a.zone), -1);
      assert.equal(b.compareDateOnlyTz(a, b.zone), -1);
      assert.equal(a.compare(b), 1);
      assert.equal(b.compare(a), -1);
    });
  });

  test('cache cleared', function() {
    // This test ensures the cached Unix time is cleared whenever the time is changed.
    let time = new Time({
      year: 2015,
      month: 4,
      day: 3,
      hour: 12,
      minute: 34,
      second: 56,
      zone: Timezone.utcTimezone
    });

    assert.equal(time.toUnixTime(), 1428064496);
    time.year++;
    assert.equal(time.toUnixTime(), 1459686896);
    time.month++;
    assert.equal(time.toUnixTime(), 1462278896);
    time.day++;
    assert.equal(time.toUnixTime(), 1462365296);
    time.hour++;
    assert.equal(time.toUnixTime(), 1462368896);
    time.minute++;
    assert.equal(time.toUnixTime(), 1462368956);
    time.second++;
    assert.equal(time.toUnixTime(), 1462368957);

    time.adjust(-397, -1, -1, -1);
    assert.equal(time.toUnixTime(), 1428064496);

    time.resetTo(2016, 5, 4, 13, 35, 57);
    assert.equal(time.toUnixTime(), 1462368957);

    // time.fromString('2015-04-03T12:34:56Z');
    // assert.equal(time.toUnixTime(), 1428064496);

    time.fromJSDate(new Date(Date.UTC(2015, 0, 1)), true);
    assert.equal(time.toUnixTime(), 1420070400);

    time.fromData({
      year: 2015,
      month: 4,
      day: 3,
      hour: 12,
      minute: 34,
      second: 56,
      zone: Timezone.utcTimezone
    });
    assert.equal(time.toUnixTime(), 1428064496);

    time.addDuration(ICAL.Duration.fromString('P1D'));
    assert.equal(time.toUnixTime(), 1428150896);

    time.fromUnixTime(1234567890);
    assert.equal(time.toUnixTime(), 1234567890);
  });

  suite("static functions", function() {
    test('daysInMonth', function() {
      assert.equal(Time.daysInMonth(0, 2011), 30);
      assert.equal(Time.daysInMonth(2, 2012), 29);
      assert.equal(Time.daysInMonth(2, 2013), 28);
      assert.equal(Time.daysInMonth(13, 2014), 30);
    });

    test('isLeapYear', function() {
      assert.isTrue(Time.isLeapYear(1752));
      assert.isTrue(Time.isLeapYear(2000));
      assert.isTrue(Time.isLeapYear(2004));
      assert.isFalse(Time.isLeapYear(2100));
    });

    test('fromDayOfYear', function() {
      assert.equal(Time.fromDayOfYear(-730, 2001).toICALString(), "19990101");
      assert.equal(Time.fromDayOfYear(-366, 2001).toICALString(), "19991231");
      assert.equal(Time.fromDayOfYear(-365, 2001).toICALString(), "20000101");
      assert.equal(Time.fromDayOfYear(0, 2001).toICALString(), "20001231");
      assert.equal(Time.fromDayOfYear(365, 2001).toICALString(), "20011231");
      assert.equal(Time.fromDayOfYear(366, 2001).toICALString(), "20020101");
      assert.equal(Time.fromDayOfYear(730, 2001).toICALString(), "20021231");
      assert.equal(Time.fromDayOfYear(731, 2001).toICALString(), "20030101");
      assert.equal(Time.fromDayOfYear(1095, 2001).toICALString(), "20031231");
      assert.equal(Time.fromDayOfYear(1096, 2001).toICALString(), "20040101");
      assert.equal(Time.fromDayOfYear(1461, 2001).toICALString(), "20041231");
      assert.equal(Time.fromDayOfYear(1826, 2001).toICALString(), "20051231");
    });

    test('fromStringv2', function() {
      let subject = Time.fromStringv2("2015-01-01");
      let expected = {
        year: 2015,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        isDate: true,
        timezone: "floating"
      };

      assert.deepEqual(
        subject.toJSON(), expected
      );
    });

    suite("weekOneStarts", function() {
      function testWeekOne(year, dates, only) {
        let dom = ICAL.Time.getDominicalLetter(year);
        (only ? test.only : test)(year + " (" + dom + ")", function() {
          for (let wkday in dates) {
            let icalwkday = ICAL.Time[wkday];
            let w1st = Time.weekOneStarts(year, icalwkday);
            assert.equal(dates[wkday], w1st.toString(), wkday);

            let startOfWeek = ICAL.Time.fromString(dates[wkday]);
            assert.equal(startOfWeek.weekNumber(icalwkday), 1, wkday);
            startOfWeek.day--;
            assert.isAbove(startOfWeek.weekNumber(icalwkday), 51, wkday);
          }
        });
      }
      testWeekOne.only = function(year, dates) {
        testWeekOne(year, dates, true);
      };

      test('default week start', function() {
        let w1st = Time.weekOneStarts(1989);
        assert.equal('1989-01-02', w1st.toString());
      });

      testWeekOne(1989, { // A and AG
        SUNDAY: '1989-01-01',
        MONDAY: '1989-01-02',
        TUESDAY: '1989-01-03',
        WEDNESDAY: '1989-01-04',
        THURSDAY: '1989-01-05',
        FRIDAY: '1988-12-30',
        SATURDAY: '1988-12-31'
      });
      testWeekOne(1994, { // B and BA
        SUNDAY: '1994-01-02',
        MONDAY: '1994-01-03',
        TUESDAY: '1994-01-04',
        WEDNESDAY: '1994-01-05',
        THURSDAY: '1994-01-06',
        FRIDAY: '1993-12-31',
        SATURDAY: '1994-01-01'
      });
      testWeekOne(1993, { // C and CB
        SUNDAY: '1993-01-03',
        MONDAY: '1993-01-04',
        TUESDAY: '1993-01-05',
        WEDNESDAY: '1993-01-06',
        THURSDAY: '1993-01-07',
        FRIDAY: '1993-01-01',
        SATURDAY: '1993-01-02'
      });
      testWeekOne(1998, { // D and DC
        SUNDAY: '1997-12-28',
        MONDAY: '1997-12-29',
        TUESDAY: '1997-12-30',
        WEDNESDAY: '1997-12-31',
        THURSDAY: '1998-01-01',
        FRIDAY: '1997-12-26',
        SATURDAY: '1997-12-27'
      });
      testWeekOne(1997, { // E and ED
        SUNDAY: '1996-12-29',
        MONDAY: '1996-12-30',
        TUESDAY: '1996-12-31',
        WEDNESDAY: '1997-01-01',
        THURSDAY: '1997-01-02',
        FRIDAY: '1996-12-27',
        SATURDAY: '1996-12-28'
      });
      testWeekOne(1991, { // F and FE
        SUNDAY: '1990-12-30',
        MONDAY: '1990-12-31',
        TUESDAY: '1991-01-01',
        WEDNESDAY: '1991-01-02',
        THURSDAY: '1991-01-03',
        FRIDAY: '1990-12-28',
        SATURDAY: '1990-12-29'
      });
      testWeekOne(1990, { // G and GF
        SUNDAY: '1989-12-31',
        MONDAY: '1990-01-01',
        TUESDAY: '1990-01-02',
        WEDNESDAY: '1990-01-03',
        THURSDAY: '1990-01-04',
        FRIDAY: '1989-12-29',
        SATURDAY: '1989-12-30'
      });
    });
  });
});
