suite('timezone', function() {
  var icsData;
  var timezone;

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
        testSupport.defineSample('timezones/' + tzid + '.ics', function(data) {
          icsData = data;
        });

        setup(function() {
          var parsed = ICAL.parse(icsData);
          var vcalendar = new ICAL.Component(parsed);
          var comp = vcalendar.getFirstSubcomponent('vtimezone');

          timezone = new ICAL.Timezone(comp);
        });
      }

      test(name, testCb);
    });
  }

  function utcHours(time) {
    var seconds = timezone.utcOffset(
      new ICAL.Time(time)
    );

    // in hours
    return (seconds / 3600);
  }

  var sanityChecks = [
    {
      // just before US DST
      time: { year: 2012, month: 3, day: 11, hour: 1, minute: 59 },
      offsets: {
        'America/Los_Angeles': -8,
        'America/New_York': -5,
        'America/Denver': -7,
        'America/Atikokan': -5, // single tz
        'UTC': 0,
        'floating': 0
      }
    },

    {
      // just after US DST
      time: { year: 2012, month: 3, day: 11, hour: 2 },
      offsets: {
        'America/Los_Angeles': -7,
        'America/Denver': -6,
        'America/New_York': -4,
        'America/Atikokan': -5,
        'UTC': 0,
        'floating': 0
      }
    },

    {
      time: { year: 2004, month: 10, day: 31, hour: 0, minute: 59, second: 59 },
      offsets: {
        'America/Denver': -6
      }
    },

    {
      time: { year: 2004, month: 10, day: 31, hour: 1 },
      offsets: {
        'America/Denver': -7
      }
    },


    // Edge case timezone that defines an RDATE with VALUE=DATE
    {
      // just before DST
      time: { year: 1980, month: 1, day: 1, hour: 0, minute: 59 },
      offsets: {
        'Makebelieve/RDATE_test': -4,
        'Makebelieve/RDATE_utc_test': -5
      }
    },

    {
      // just after DST
      time: { year: 1980, month: 1, day: 1, hour: 1 },
      offsets: {
        'Makebelieve/RDATE_test': -5,
        'Makebelieve/RDATE_utc_test': -5
      }
    },

    // Edge case where RDATE is defined in UTC
    {
      // just before DST
      time: { year: 1990, month: 1, day: 1, hour: 0, minute: 59 },
      offsets: {
        'Makebelieve/RDATE_test': -4,
        'Makebelieve/RDATE_utc_test': -4
      }
    },

    {
      // just after DST
      time: { year: 1990, month: 1, day: 1, hour: 2 },
      offsets: {
        'Makebelieve/RDATE_test': -5,
        'Makebelieve/RDATE_utc_test': -5
      }
    },

    // Edge case timezone where an RRULE with UNTIL in UTC is specified
    {
      // Just before DST
      time: { year: 1975, month: 1, day: 1, hour: 1, minute: 0, second: 0 },
      offsets: {
        'Makebelieve/RRULE_UNTIL_test': -5
      }
    },
    {
      // Just after DST
      time: { year: 1975, month: 1, day: 1, hour: 3, minute: 0, second: 0 },
      offsets: {
        'Makebelieve/RRULE_UNTIL_test': -4
      }
    },
    {
      // After the RRULE ends
      time: { year: 1985, month: 1, day: 1, hour: 3, minute: 0, second: 0 },
      offsets: {
        'Makebelieve/RRULE_UNTIL_test': -4
      }
    }
  ];

  // simple format checks
  sanityChecks.forEach(function(item) {
    var title = 'time: ' + JSON.stringify(item.time);

    suite(title, function() {
      for (var tzid in item.offsets) {
        timezoneTest(tzid, tzid + " offset " + item.offsets[tzid], function(tzid) {
          assert.equal(
            utcHours(item.time),
            item.offsets[tzid]
          );
        }.bind(this, tzid));
      }
    });
  });

  timezoneTest('America/Los_Angeles', '#expandedUntilYear', function() {

    function calcYear(yr) {
        return Math.max(ICAL.Timezone._minimumExpansionYear, yr) +
               ICAL.Timezone.EXTRA_COVERAGE;
    }

    var time = new ICAL.Time({
      year: 2012,
      zone: timezone
    });
    var expectedCoverage = calcYear(time.year);

    time.utcOffset();
    assert.equal(timezone.expandedUntilYear, expectedCoverage);

    time = new ICAL.Time({
      year: 2014,
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

    time = new ICAL.Time({
      year: ICAL.Timezone.MAX_YEAR + 1,
      zone: timezone
    });
    time.utcOffset();
    assert.equal(timezone.expandedUntilYear, ICAL.Timezone.MAX_YEAR);
  });

  suite('#convertTime', function() {
    timezoneTest('America/Los_Angeles', 'convert date-time from utc', function() {
      var subject = new ICAL.Time.fromString('2012-03-11T01:59:00Z');
      var subject2 = subject.convertToZone(timezone);
      assert.equal(subject2.zone.tzid, timezone.tzid);
      assert.equal(subject2.toString(), '2012-03-10T17:59:00');
    });

    timezoneTest('America/Los_Angeles', 'convert date from utc', function() {
      var subject = new ICAL.Time.fromString('2012-03-11');
      var subject2 = subject.convertToZone(timezone);
      assert.equal(subject2.zone.tzid, timezone.tzid);
      assert.equal(subject2.toString(), '2012-03-11');
    });
    timezoneTest('America/Los_Angeles', 'convert local time to zone', function() {
      var subject = new ICAL.Time.fromString('2012-03-11T01:59:00');
      subject.zone = ICAL.Timezone.localTimezone;
      assert.equal(subject.toString(), '2012-03-11T01:59:00');

      var subject2 = subject.convertToZone(timezone);
      assert.equal(subject2.toString(), '2012-03-11T01:59:00');

      var subject3 = subject2.convertToZone(ICAL.Timezone.localTimezone);
      assert.equal(subject3.toString(), '2012-03-11T01:59:00');
    });
  });

  suite('#fromData', function() {
    timezoneTest('America/Los_Angeles', 'string component', function() {
      var subject = new ICAL.Timezone({
        component: timezone.component.toString(),
        tzid: 'Makebelieve/Different'
      });

      assert.equal(subject.expandedUntilYear, 0);
      assert.equal(subject.tzid, 'Makebelieve/Different');
      assert.equal(subject.component.getFirstPropertyValue('tzid'), 'America/Los_Angeles');
    });

    timezoneTest('America/Los_Angeles', 'component in data', function() {
      var subject = new ICAL.Timezone({
        component: timezone.component,
      });

      assert.equal(subject.tzid, 'America/Los_Angeles');
      assert.deepEqual(subject.component, timezone.component);
    });

    timezoneTest('America/Los_Angeles', 'with strange component', function() {
      var subject = new ICAL.Timezone({
        component: 123
      });

      assert.isNull(subject.component);
    });
  });

  suite('#utcOffset', function() {
    test('empty vtimezone', function() {
      var subject = new ICAL.Timezone({
        component: new ICAL.Component('vtimezone')
      });

      assert.equal(subject.utcOffset(ICAL.Time.fromString('2012-01-01')), 0);
    });

    test('empty STANDARD/DAYLIGHT', function() {
      var subject = new ICAL.Timezone({
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
    var subject = ICAL.Timezone._compare_change_fn;

    var a = new ICAL.Time({
      year: 2015,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30,
      second: 30
    });

    function vary(prop) {
      var b = a.clone();
      assert.equal(subject(a, b), 0);
      b[prop] += 1;
      assert.equal(subject(a, b), -1);
      b[prop] -= 2;
      assert.equal(subject(a, b), 1);
    }

    ['year', 'month', 'day', 'hour', 'minute', 'second'].forEach(vary);
  });
});
