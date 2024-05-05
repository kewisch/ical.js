suite('timezone', function() {
  let timezone;

  function timezoneTest(tzid, name, testCb) {
    if (typeof(name) === 'function') {
      testCb = name;
      name = 'parse';
    }

    suite(tzid, function() {
      if (tzid == "UTC") {
        setup(function() {
          timezone = ICAL.Timezone.utcTimezone;
        });
      } else if (tzid == "floating") {
        setup(function() {
          timezone = ICAL.Timezone.localTimezone;
        });
      } else {
        setup(async function() {
          let icsData = await testSupport.loadSample('timezones/' + tzid + '.ics');

          let parsed = ICAL.parse(icsData);
          let vcalendar = new ICAL.Component(parsed);
          let comp = vcalendar.getFirstSubcomponent('vtimezone');

          timezone = new ICAL.Timezone(comp);
        });
      }

      test(name, testCb);
    });
  }

  function utcHours(time) {
    let seconds = timezone.utcOffset(
      new ICAL.Time(time)
    );

    // in hours
    return (seconds / 3600);
  }

  function sanityCheckSuite(options) {
    let runner = options.only ? suite.only : suite;
    let title = 'time: ' + JSON.stringify(options.time);

    runner(title, function() {
      for (let tzid in options.offsets) {
        timezoneTest(tzid, tzid + " offset " + options.offsets[tzid], function(testTzid) {
          assert.equal(
            utcHours(options.time),
            options.offsets[testTzid]
          );
        }.bind(this, tzid));
      }
    });
  }
  sanityCheckSuite.only = function(options) {
    options.only = true;
    sanityCheckSuite(options);
  };


  // just before US DST
  sanityCheckSuite({
    time: { year: 2012, month: 3, day: 11, hour: 1, minute: 59 },
    offsets: {
      'America/Los_Angeles': -8,
      'America/New_York': -5,
      'America/Denver': -7,
      'America/Atikokan': -5, // single tz
      'UTC': 0,
      'floating': 0
    }
  });

  // just after US DST
  sanityCheckSuite({
    time: { year: 2012, month: 3, day: 11, hour: 2 },
    offsets: {
      'America/Los_Angeles': -7,
      'America/Denver': -6,
      'America/New_York': -4,
      'America/Atikokan': -5,
      'UTC': 0,
      'floating': 0
    }
  });

  sanityCheckSuite({
    time: { year: 2004, month: 10, day: 31, hour: 0, minute: 59, second: 59 },
    offsets: {
      'America/Denver': -6
    }
  });

  sanityCheckSuite({
    time: { year: 2004, month: 10, day: 31, hour: 1 },
    offsets: {
      'America/Denver': -7
    }
  });


  // Edge case timezone that defines an RDATE with VALUE=DATE
  sanityCheckSuite({
    // just before DST
    time: { year: 1980, month: 1, day: 1, hour: 0, minute: 59 },
    offsets: {
      'Makebelieve/RDATE_test': -4,
      'Makebelieve/RDATE_utc_test': -5
    }
  });

  sanityCheckSuite({
    // just after DST
    time: { year: 1980, month: 1, day: 1, hour: 1 },
    offsets: {
      'Makebelieve/RDATE_test': -5,
      'Makebelieve/RDATE_utc_test': -5
    }
  });

  // Edge case where RDATE is defined in UTC
  sanityCheckSuite({
    // just before DST
    time: { year: 1990, month: 1, day: 1, hour: 0, minute: 59 },
    offsets: {
      'Makebelieve/RDATE_test': -4,
      'Makebelieve/RDATE_utc_test': -4
    }
  });

  sanityCheckSuite({
    // just after DST
    time: { year: 1990, month: 1, day: 1, hour: 2 },
    offsets: {
      'Makebelieve/RDATE_test': -5,
      'Makebelieve/RDATE_utc_test': -5
    }
  });

  // Edge case timezone where an RRULE with UNTIL in UTC is specified
  sanityCheckSuite({
    // Just before DST
    time: { year: 1975, month: 1, day: 1, hour: 1, minute: 0, second: 0 },
    offsets: {
      'Makebelieve/RRULE_UNTIL_test': -5
    }
  });

  sanityCheckSuite({
    // Just after DST
    time: { year: 1975, month: 1, day: 1, hour: 3, minute: 0, second: 0 },
    offsets: {
      'Makebelieve/RRULE_UNTIL_test': -4
    }
  });

  sanityCheckSuite({
    // After the RRULE ends
    time: { year: 1985, month: 1, day: 1, hour: 3, minute: 0, second: 0 },
    offsets: {
      'Makebelieve/RRULE_UNTIL_test': -4
    }
  });

  timezoneTest('America/Los_Angeles', '#expandedUntilYear', function() {

    function calcYear(yr) {
        return Math.max(ICAL.Timezone._minimumExpansionYear, yr) +
               ICAL.Timezone.EXTRA_COVERAGE;
    }

    let time = new ICAL.Time({
      year: 2032,
      zone: timezone
    });
    let expectedCoverage = calcYear(time.year);

    time.utcOffset();
    assert.equal(timezone.expandedUntilYear, expectedCoverage);

    time = new ICAL.Time({
      year: 2034,
      zone: timezone
    });

    time.utcOffset();
    assert.equal(timezone.expandedUntilYear, expectedCoverage);

    time = new ICAL.Time({
      year: 1997,
      zone: timezone
    });
    time.utcOffset();
    assert.equal(timezone.expandedUntilYear, expectedCoverage);

    time = new ICAL.Time({
      year: expectedCoverage + 3,
      zone: timezone
    });
    expectedCoverage = calcYear(time.year);
    time.utcOffset();
    assert.equal(timezone.expandedUntilYear, expectedCoverage);
  });

  suite('#convertTime', function() {
    timezoneTest('America/Los_Angeles', 'convert date-time from utc', function() {
      let subject = ICAL.Time.fromString('2012-03-11T01:59:00Z');
      let subject2 = subject.convertToZone(timezone);
      assert.equal(subject2.zone.tzid, timezone.tzid);
      assert.equal(subject2.toString(), '2012-03-10T17:59:00');
    });

    timezoneTest('America/Los_Angeles', 'convert date from utc', function() {
      let subject = ICAL.Time.fromString('2012-03-11');
      let subject2 = subject.convertToZone(timezone);
      assert.equal(subject2.zone.tzid, timezone.tzid);
      assert.equal(subject2.toString(), '2012-03-11');
    });
    timezoneTest('America/Los_Angeles', 'convert local time to zone', function() {
      let subject = ICAL.Time.fromString('2012-03-11T01:59:00');
      subject.zone = ICAL.Timezone.localTimezone;
      assert.equal(subject.toString(), '2012-03-11T01:59:00');

      let subject2 = subject.convertToZone(timezone);
      assert.equal(subject2.toString(), '2012-03-11T01:59:00');

      let subject3 = subject2.convertToZone(ICAL.Timezone.localTimezone);
      assert.equal(subject3.toString(), '2012-03-11T01:59:00');
    });
  });

  suite('#fromData', function() {
    timezoneTest('America/Los_Angeles', 'string component', function() {
      let subject = new ICAL.Timezone({
        component: timezone.component.toString(),
        tzid: 'Makebelieve/Different'
      });

      assert.equal(subject.expandedUntilYear, 0);
      assert.equal(subject.tzid, 'Makebelieve/Different');
      assert.equal(subject.component.getFirstPropertyValue('tzid'), 'America/Los_Angeles');
    });

    timezoneTest('America/Los_Angeles', 'component in data', function() {
      let subject = new ICAL.Timezone({
        component: timezone.component,
      });

      assert.equal(subject.tzid, 'America/Los_Angeles');
      assert.deepEqual(subject.component, timezone.component);
    });

    timezoneTest('America/Los_Angeles', 'with strange component', function() {
      let subject = new ICAL.Timezone({
        component: 123
      });

      assert.isNull(subject.component);
    });
  });

  suite('#utcOffset', function() {
    test('empty vtimezone', function() {
      let subject = new ICAL.Timezone({
        component: new ICAL.Component('vtimezone')
      });

      assert.equal(subject.utcOffset(ICAL.Time.fromString('2012-01-01')), 0);
    });

    test('empty STANDARD/DAYLIGHT', function() {
      let subject = new ICAL.Timezone({
        component: new ICAL.Component(['vtimezone', [], [
          ['standard', [], []],
          ['daylight', [], []]
        ]])
      });

      assert.equal(subject.utcOffset(ICAL.Time.fromString('2012-01-01')), 0);
    });
  });

  suite('#toString', function() {
    timezoneTest('America/Los_Angeles', 'toString', function() {
      assert.equal(timezone.toString(), "America/Los_Angeles");
      assert.equal(timezone.tzid, "America/Los_Angeles");
      assert.equal(timezone.tznames, "");

      timezone.tznames = "test";
      assert.equal(timezone.toString(), "test");
      assert.equal(timezone.tzid, "America/Los_Angeles");
      assert.equal(timezone.tznames, "test");
    });
  });

  test('#_compare_change_fn', function() {
    let subject = ICAL.Timezone._compare_change_fn;

    let a = new ICAL.Time({
      year: 2015,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30,
      second: 30
    });

    function vary(prop) {
      let b = a.clone();
      assert.equal(subject(a, b), 0);
      b[prop] += 1;
      assert.equal(subject(a, b), -1);
      b[prop] -= 2;
      assert.equal(subject(a, b), 1);
    }

    ['year', 'month', 'day', 'hour', 'minute', 'second'].forEach(vary);
  });
});
