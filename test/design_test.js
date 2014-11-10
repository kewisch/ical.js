suite('design', function() {

  var timezone;
  testSupport.defineSample('timezones/America/New_York.ics', function(data) {
    var parsed = ICAL.parse(data);
    var vcalendar = new ICAL.Component(parsed);
    var vtimezone = vcalendar.getFirstSubcomponent('vtimezone');

    timezone = new ICAL.Timezone(vtimezone);
    ICAL.TimezoneService.register('test', timezone);
  });

  suiteTeardown(function() {
    ICAL.TimezoneService.reset();
  });

  var subject;
  setup(function() {
    subject = ICAL.design;
  });

  suite('types', function() {

    suite('binary', function() {
      setup(function() {
        subject = subject.value.binary;
      });

      test('#(un)decorate', function() {
        var expectedDecode = 'The quick brown fox jumps over the lazy dog.';
        var undecorated = 'VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcy' +
                          'BvdmVyIHRoZSBsYXp5IGRvZy4=';

        var decorated = subject.decorate(undecorated);
        var decoded = decorated.decodeValue();

        assert.equal(decoded, expectedDecode);

        assert.equal(
          subject.undecorate(decorated),
          undecorated
        );
      });
    });

    suite('date', function() {
      setup(function() {
        subject = subject.value.date;
      });

      test('#fromICAL', function() {
        var value = subject.fromICAL(
          '20121010'
        );

        assert.equal(value, '2012-10-10');
      });

      test('#toICAL', function() {
        var value = subject.toICAL(
          '2012-10-10'
        );

        assert.equal(value, '20121010');
      });

      test('#(un)decorate (custom timezone)', function() {
        var value = '2012-10-10';
        var prop = new ICAL.Property(['date', { tzid: 'test' }]);

        var time = subject.decorate(
          value,
          prop
        );

        assert.hasProperties(
          time,
          { year: 2012, month: 10, day: 10, isDate: true }
        );

        assert.equal(
          subject.undecorate(time),
          value
        );
      });
    });


    suite('date-time', function() {
      setup(function() {
        subject = subject.value['date-time'];
      });

      test('#(from|to)ICAL', function() {
        var value = '20120901T130000';
        var expected = '2012-09-01T13:00:00';
        var time = subject.fromICAL(value);

        assert.equal(
          subject.fromICAL(value),
          expected
        );

        assert.equal(
          subject.toICAL(expected),
          value
        );
      });

      test('#(un)decorate (utc)', function() {
        var undecorated = '2012-09-01T13:05:11Z';
        var prop = new ICAL.Property(['date-time', {}]);

        var decorated = subject.decorate(undecorated, prop);

        assert.hasProperties(
          decorated,
          {
            year: 2012,
            month: 9,
            day: 1,
            hour: 13,
            minute: 05,
            second: 11,
            isDate: false,
            zone: ICAL.Timezone.utcTimezone
          }
        );

        assert.equal(
          subject.undecorate(decorated),
          undecorated
        );
      });

      test('#(un)decorate (custom timezone)', function() {
        var prop = new ICAL.Property(
          ['date-time', { tzid: 'test' }]
        );
        assert.equal(prop.getParameter('tzid'), 'test');

        ICAL.TimezoneService.register(
          'America/Los_Angeles',
          ICAL.Timezone.utcTimezone
        );

        var undecorated = '2012-09-01T13:05:11';
        var decorated = subject.decorate(undecorated, prop);
        assert.equal(decorated.zone, timezone);

        assert.hasProperties(
          decorated,
          {
            year: 2012,
            month: 9,
            day: 1,
            hour: 13,
            minute: 05,
            second: 11,
            isDate: false
          }
        );

        assert.equal(
          subject.undecorate(decorated),
          undecorated
        );
      });
    });

    suite('duration', function() {
      setup(function() {
        subject = subject.value.duration;
      });

      test('#(un)decorate', function() {
        var undecorated = 'P15DT5H5M20S';
        var decorated = subject.decorate(undecorated);
        assert.equal(subject.undecorate(decorated), undecorated);
      });
    });

    suite('float', function() {
      setup(function() {
        subject = subject.value.float;
      });

      test('#(from|to)ICAL', function() {
        var original = '1.5';
        var fromICAL = subject.fromICAL(original);

        assert.equal(fromICAL, 1.5);
        assert.equal(subject.toICAL(fromICAL), original);
      });
    });

    suite('integer', function() {
      setup(function() {
        subject = subject.value.integer;
      });

      test('#(from|to)ICAL', function() {
        var original = '105';
        var fromICAL = subject.fromICAL(original);

        assert.equal(fromICAL, 105);
        assert.equal(subject.toICAL(fromICAL), original);
      });
    });

    suite('period', function() {
      setup(function() {
        subject = subject.value.period;
      });

      test('#(to|from)ICAL date/date', function() {
        var original = '19970101T180000Z/19970102T070000Z';
        var fromICAL = subject.fromICAL(original);

        assert.deepEqual(
          fromICAL,
          ['1997-01-01T18:00:00Z', '1997-01-02T07:00:00Z']
        );

        assert.equal(
          subject.toICAL(fromICAL),
          original
        );
      });

      test('#(un)decorate (date-time/duration)', function() {
        var prop = new ICAL.Property(['date', { tzid: 'test' }]);

        var undecorated = ['1997-01-01T18:00:00', 'PT5H30M'];
        var decorated = subject.decorate(
          undecorated,
          prop
        );

        assert.hasProperties(
          decorated.start,
          {
            year: 1997,
            day: 1,
            month: 1,
            hour: 18
          }
        );

        assert.equal(decorated.start.zone, timezone);

        assert.hasProperties(
          decorated.duration,
          {
            hours: 5,
            minutes: 30
          }
        );

        assert.deepEqual(subject.undecorate(decorated), undecorated);
      });

      test('#(un)decorate (date-time/date-time)', function() {
        var prop = new ICAL.Property(['date', { tzid: 'test' }]);

        var undecorated = ['1997-01-01T18:00:00', '1998-01-01T17:00:00'];
        var decorated = subject.decorate(
          undecorated,
          prop
        );

        assert.hasProperties(
          decorated.start,
          {
            year: 1997,
            day: 1,
            month: 1,
            hour: 18
          }
        );

        assert.hasProperties(
          decorated.end,
          {
            year: 1998,
            day: 1,
            month: 1,
            hour: 17
          }
        );


        assert.equal(decorated.start.zone, timezone);
        assert.equal(decorated.end.zone, timezone);

        assert.deepEqual(subject.undecorate(decorated), undecorated);
      });

      test('#(un)decorate (date-time/duration)', function() {
        var prop = new ICAL.Property(['date', { tzid: 'test' }]);

        var undecorated = ['1997-01-01T18:00:00', 'PT5H30M'];
        var decorated = subject.decorate(
          undecorated,
          prop
        );

        assert.hasProperties(
          decorated.start,
          {
            year: 1997,
            day: 1,
            month: 1,
            hour: 18
          }
        );

        assert.equal(decorated.start.zone, timezone);

        assert.hasProperties(
          decorated.duration,
          {
            hours: 5,
            minutes: 30
          }
        );

        assert.deepEqual(subject.undecorate(decorated), undecorated);
      });
    });

    suite('recur', function() {
      setup(function() {
        subject = subject.value.recur;
      });

      test('#(to|from)ICAL', function() {
        var original = 'FREQ=MONTHLY;UNTIL=20121112T131415;COUNT=1';
        var fromICAL = subject.fromICAL(original);

        assert.deepEqual(fromICAL, {
          freq: 'MONTHLY',
          until: '2012-11-12T13:14:15',
          count: 1
        })

        assert.equal(
          subject.toICAL(fromICAL),
          original
        );
      });

      test('#(un)decorate', function() {
        var undecorated = { freq: "MONTHLY", byday: ["MO", "TU", "WE", "TH", "FR"], until: "2012-10-12" };
        var decorated = subject.decorate(undecorated);

        assert.instanceOf(decorated, ICAL.Recur);

        assert.hasProperties(
          decorated,
          {
            freq: 'MONTHLY',
            parts: {
              BYDAY: ['MO', 'TU', 'WE', 'TH', 'FR']
            }
          }
        );

        assert.hasProperties(
          decorated.until,
          {
            year: 2012,
            month: 10,
            day: 12
          }
        );

        assert.deepEqual(subject.undecorate(decorated), undecorated);
      });
    });

    suite('utc-offset', function() {
      setup(function() {
        subject = subject.value['utc-offset'];
      });

      test('#(to|from)ICAL without seconds', function() {
        var original = '-0500';
        var fromICAL = subject.fromICAL(original);

        assert.equal(fromICAL, '-05:00');
        assert.equal(
          subject.toICAL(fromICAL),
          original
        );
      });

      test('#(to|from)ICAL with seconds', function() {
        var original = '+054515';
        var fromICAL = subject.fromICAL(original);

        assert.equal(fromICAL, '+05:45:15');
        assert.equal(
          subject.toICAL(fromICAL),
          original
        );
      });

      test('#(un)decorate', function() {
        var undecorated = '-05:00';
        var decorated = subject.decorate(undecorated);

        assert.equal(decorated.hours, 5, 'hours');
        assert.equal(decorated.factor, -1, 'factor');

        assert.equal(
          subject.undecorate(decorated),
          undecorated
        );
      });
    });

    suite("unknown and default values", function() {
      test("unknown x-prop", function() {
        var prop = new ICAL.Property("x-wr-calname");
        assert.equal(prop.type, "unknown");

        prop = ICAL.Property.fromString("X-WR-CALNAME:value");
        assert.equal(prop.type, "unknown");
      });

      test("unknown iana prop", function() {
        var prop = new ICAL.Property("standardized");
        assert.equal(prop.type, "unknown");

        prop = ICAL.Property.fromString("STANDARDIZED:value");
        assert.equal(prop.type, "unknown");
      });

      test("known text type", function() {
        var prop = new ICAL.Property("description");
        assert.equal(prop.type, "text");

        prop = ICAL.Property.fromString("DESCRIPTION:value");
        assert.equal(prop.type, "text");
      });

      test("encoded text value roundtrip", function() {
        var prop = new ICAL.Property("description");
        prop.setValue("hello, world");
        var propVal = prop.toICAL();
        assert.equal(propVal, "DESCRIPTION:hello\\, world");

        prop = ICAL.Property.fromString(propVal);
        assert.equal(prop.getFirstValue(), "hello, world");
      });

      test("encoded unknown value roundtrip", function() {
        var prop = new ICAL.Property("x-wr-calname");
        prop.setValue("hello, world");
        var propVal = prop.toICAL();
        assert.equal(propVal, "X-WR-CALNAME:hello, world");

        prop = ICAL.Property.fromString(propVal);
        assert.equal(prop.getFirstValue(), "hello, world");
      });

      test("encoded unknown value from string", function() {
        var prop = ICAL.Property.fromString("X-WR-CALNAME:hello\\, world");
        assert.equal(prop.getFirstValue(), "hello\\, world");
      });

      suite("registration", function() {
        test("newly registered property", function() {
          var prop = new ICAL.Property("nonstandard");
          assert.equal(prop.type, "unknown");

          ICAL.design.registerProperty("nonstandard", {
            defaultType: "date-time"
          });

          prop = new ICAL.Property("nonstandard");
          assert.equal(prop.type, "date-time");
        });

        test("double property registration", function() {
          assert.throws(function() {
            ICAL.design.registerProperty("dtstart", {});
          }, /already registered/);
        });

        test("unknown value type", function() {
          var prop = ICAL.Property.fromString("X-PROP;VALUE=FUZZY:WARM");
          assert.equal(prop.name, "x-prop");
          assert.equal(prop.type, "fuzzy");
          assert.equal(prop.getFirstValue(), "WARM");
          prop.setValue("FREEZING");
          assert.equal(prop.getFirstValue(), "FREEZING");
        });

        test("newly registered value type", function() {
          ICAL.design.registerValue("fuzzy", {
            fromICAL: function(aValue) {
              return aValue.toLowerCase();
            },
            toICAL: function(aValue) {
              return aValue.toUpperCase();
            }
          });

          var prop = ICAL.Property.fromString("X-PROP;VALUE=FUZZY:WARM");
          assert.equal(prop.name, "x-prop");
          assert.equal(prop.getFirstValue(), "warm");
          assert.match(prop.toICAL(), /WARM/);
        });

        test("double value registration", function() {
          assert.throws(function() {
            ICAL.design.registerValue("text", {});
          }, /already registered/);
        });

        test("newly registered parameter", function() {
          var prop = ICAL.Property.fromString("X-PROP;VALS=a,b,c:def");
          var param = prop.getParameter("vals");
          assert.equal(param, "a,b,c");

          ICAL.design.registerParameter("vals", { multiValue: "," });

          prop = ICAL.Property.fromString("X-PROP;VALS=a,b,c:def");
          param = prop.getParameter("vals");
          assert.equal(param, ["a","b","c"]);
        });

        test("double parameter registration", function() {
          assert.throws(function() {
            ICAL.design.registerParameter("rsvp", {});
          }, /already registered/);
        });
      });
    });
  });
});
