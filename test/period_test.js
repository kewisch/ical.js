suite('ical/period', function() {

  let start, end, duration;

  setup(function() {
    start = ICAL.Time.fromString("1970-01-02T03:04:05Z");
    end = ICAL.Time.fromString("1970-01-02T03:04:05Z");
    duration = ICAL.Duration.fromString("PT3H2M1S");
  });

  suite('#fromString', function() {
    function verify(string, icalstring, data) {
      test('parse: "' + string + '"', function() {
        let subject = ICAL.Period.fromString(string);

        assert.equal(subject.toICALString(), icalstring);
        assert.equal(subject.toString(), string);

        if ('start' in data) {
          assert.instanceOf(subject.start, ICAL.Time);
          assert.hasProperties(
            subject.start,
            data.start,
            'start property'
          );
        }

        if ('end' in data) {
          if (data.end) {
            assert.instanceOf(subject.end, ICAL.Time);
            assert.hasProperties(
              subject.end,
              data.end,
              'end property'
            );
          } else {
            assert.isNull(subject.end);
          }
        }

        if ('duration' in data) {
          if (data.duration) {
            assert.instanceOf(subject.duration, ICAL.Duration);
            assert.hasProperties(
              subject.duration,
              data.duration,
              'duration property'
            );
          } else {
            assert.isNull(subject.duration);
          }
        }

        if ('calculatedDuration' in data) {
          let dur = subject.getDuration();

          if ('duration' in data && data.duration) {
            assert.hasProperties(dur, data.duration, 'duration matches calculated');
          }
          assert.hasProperties(dur, data.calculatedDuration);
        }
        if ('calculatedEnd' in data) {
          let subjectEnd = subject.getEnd();

          if ('end' in data && data.end) {
            assert.hasProperties(subjectEnd, data.end, 'duration matches calculated');
          }
          assert.hasProperties(subjectEnd, data.calculatedEnd);
        }
      });
    }

    function verifyFail(testname, string, errorParam) {
      test('invalid input "' + string + '"', function() {
        assert.throws(function() {
          ICAL.Period.fromString(string);
        }, errorParam);
      });
    }

    verifyFail('missing slash', '1997-01-01T18:30:20Z1997-01-02T07:00:00Z', /Invalid string value/);
    verifyFail('invalid start date', 'some time before/1997-01-02T07:00:00Z', /invalid date-time value/);
    verifyFail('invalid end param', '1997-01-02T07:00:00Z/some time after', /invalid date-time value/);
    verifyFail('invalid end param that might be a duration', '1997-01-02T07:00:00Z/Psome time after', /invalid duration value/);

    verify('1997-01-01T18:30:20Z/1997-01-02T07:00:00Z', '19970101T183020Z/19970102T070000Z', {
      start: {
        year: 1997,
        month: 1,
        day: 1,
        hour: 18,
        minute: 30,
        second: 20
      },

      end: {
        year: 1997,
        month: 1,
        day: 2,
        hour: 7
      },

      duration: null,
      calculatedDuration: {
        isNegative: false,
        hours: 12,
        minutes: 29,
        seconds: 40
      },
      calculatedEnd: {
        year: 1997,
        month: 1,
        day: 2,
        hour: 7
      },
    });

    verify('1997-01-01T18:00:00Z/PT5H30M', '19970101T180000Z/PT5H30M', {
      start: {
        year: 1997,
        month: 1,
        day: 1,
        hour: 18
      },
      duration: {
        isNegative: false,
        hours: 5,
        minutes: 30
      },
      end: null,
      calculatedDuration: {
        isNegative: false,
        hours: 5,
        minutes: 30
      },
      calculatedEnd: {
        year: 1997,
        month: 1,
        day: 1,
        hour: 23,
        minute: 30
      }
    });

  });

  suite('#fromData', function() {
    test('valid start,end', function() {
      let subject = ICAL.Period.fromData({
        start: start,
        end: end
      });

      assert.hasProperties(subject.start, start, 'start date');
      assert.hasProperties(subject.end, end, 'end date');
      assert.isNull(subject.duration);
    });
    test('valid start,duration', function() {
      let subject = ICAL.Period.fromData({
        start: start,
        duration: duration,
      });

      assert.hasProperties(subject.start, start, 'start date');
      assert.isNull(subject.end);
      assert.hasProperties(subject.duration, duration, 'duration');
    });

    test('end value exists but is null', function() {
      let subject = ICAL.Period.fromData({
        start: start,
        end: null
      });
      assert.hasProperties(subject.start, start, 'start date');
      assert.isNull(subject.end);
      assert.isNull(subject.duration);
    });

    test('start value exists but is null', function() {
      let subject = ICAL.Period.fromData({
        start: null,
        duration: duration,
      });
      assert.isNull(subject.start);
      assert.isNull(subject.end);
      assert.hasProperties(subject.duration, duration, 'duration');
    });

    test('duration value exists but is null', function() {
      let subject = ICAL.Period.fromData({
        start: start,
        duration: null,
      });
      assert.hasProperties(subject.start, start, 'start date');
      assert.isNull(subject.end);
      assert.isNull(subject.duration);
    });

    test('start,end and duration', function() {
      assert.throws(function() {
        ICAL.Period.fromData({
          start: start,
          end: end,
          duration: duration
        });
      }, /cannot accept both end and duration/);
    });

    test('start,end and duration but one is null', function() {
      let subject = ICAL.Period.fromData({
        start: start,
        end: null,
        duration: duration
      });
      assert.hasProperties(subject.start, start, 'start date');
      assert.isNull(subject.end);
      assert.hasProperties(subject.duration, duration, 'duration');
    });

    test('invalid start value', function() {
      assert.throws(function() {
        ICAL.Period.fromData({
          start: '1970-01-02T03:04:05Z',
          end: end
        });
      }, /start must be an instance/);
    });
    test('invalid end value', function() {
      assert.throws(function() {
        ICAL.Period.fromData({
          start: start,
          end: '1970-01-02T03:04:05Z'
        });
      }, /end must be an instance/);
    });
    test('invalid duration value', function() {
      assert.throws(function() {
        ICAL.Period.fromData({
          start: start,
          duration: 'PT1S'
        });
      }, /duration must be an instance/);
    });
  });

  suite('#toString', function() {
    test('start,end', function() {
        let subject = ICAL.Period.fromData({
          start: start,
          end: end
        });
        assert.equal(subject.toString(), '1970-01-02T03:04:05Z/1970-01-02T03:04:05Z');
    });
    test('start,duration', function() {
        let subject = ICAL.Period.fromData({
          start: start,
          duration: duration
        });
        assert.equal(subject.toString(), '1970-01-02T03:04:05Z/PT3H2M1S');
    });
  });

  suite("generating jCal", function() {
    test("jCal from parser", function() {
      let prop = ICAL.parse.property("FREEBUSY:20140401T010101/PT1H");
      let val = prop[3];
      assert.deepEqual(val, ["2014-04-01T01:01:01", "PT1H"]);
    });
    test("jCal from property", function() {
      let prop = ICAL.Property.fromString("FREEBUSY:20140401T010101/PT1H");
      let val = prop.getFirstValue().toJSON();
      assert.deepEqual(val, ["2014-04-01T01:01:01", "PT1H"]);
    });
  });

  suite("#clone", function() {
    test('cloned start/duration', function() {
      let subjectstart = start.clone();
      let subjectduration = duration.clone();
      let subject1 = ICAL.Period.fromData({ start: subjectstart, duration: subjectduration });
      let subject2 = subject1.clone();
      subjectstart.hour++;
      subjectduration.hours++;

      assert.equal(subject1.start.hour, 4);
      assert.equal(subject2.start.hour, 3);

      assert.equal(subject1.duration.hours, 4);
      assert.equal(subject2.duration.hours, 3);
    });
    test('cloned start/end', function() {
      let subjectstart = start.clone();
      let subjectend = end.clone();
      let subject1 = ICAL.Period.fromData({ start: subjectstart, end: subjectend });
      let subject2 = subject1.clone();
      subjectstart.hour++;
      subjectend.hour++;

      assert.equal(subject1.start.hour, 4);
      assert.equal(subject2.start.hour, 3);

      assert.equal(subject1.end.hour, 4);
      assert.equal(subject2.end.hour, 3);
    });
    test('cloned empty object', function() {
      // most importantly, this shouldn't throw.
      let subject1 = ICAL.Period.fromData();
      let subject2 = subject1.clone();

      assert.equal(subject1.start, subject2.start);
      assert.equal(subject1.end, subject2.end);
      assert.equal(subject1.duration, subject2.duration);
    });
  });

  suite("#compare", function() {
    test("with date", function() {
      let subject = ICAL.Period.fromData({
        start: ICAL.Time.fromString("1970-01-02T03:04:04Z"),
        end: ICAL.Time.fromString("1970-01-02T03:04:06Z")
      });

      let beforestart = ICAL.Time.fromString("1970-01-02T03:04:03Z");
      let between = ICAL.Time.fromString("1970-01-02T03:04:05Z");
      let afterend = ICAL.Time.fromString("1970-01-02T03:04:07Z");

      assert.equal(subject.compare(beforestart), 1);
      assert.equal(subject.compare(subject.start), 0);
      assert.equal(subject.compare(between), 0);
      assert.equal(subject.compare(subject.end), 0);
      assert.equal(subject.compare(afterend), -1);
    });

    test("with other period", function() {
      let subject = ICAL.Period.fromData({
        start: ICAL.Time.fromString("1970-01-02T03:04:04Z"),
        end: ICAL.Time.fromString("1970-01-02T03:04:06Z")
      });

      let beforestart = ICAL.Period.fromData({
        start: ICAL.Time.fromString("1970-01-02T03:04:02Z"),
        end: ICAL.Time.fromString("1970-01-02T03:04:03Z")
      });
      let overlapstart = ICAL.Period.fromData({
        start: ICAL.Time.fromString("1970-01-02T03:04:03Z"),
        end: ICAL.Time.fromString("1970-01-02T03:04:05Z")
      });
      let within = ICAL.Period.fromData({
        start: ICAL.Time.fromString("1970-01-02T03:04:05Z"),
        end: ICAL.Time.fromString("1970-01-02T03:04:05Z")
      });
      let overlapend = ICAL.Period.fromData({
        start: ICAL.Time.fromString("1970-01-02T03:04:05Z"),
        end: ICAL.Time.fromString("1970-01-02T03:04:07Z")
      });
      let afterend = ICAL.Period.fromData({
        start: ICAL.Time.fromString("1970-01-02T03:04:07Z"),
        end: ICAL.Time.fromString("1970-01-02T03:04:09Z")
      });

      assert.equal(subject.compare(beforestart), 1);
      assert.equal(subject.compare(overlapstart), 0);
      assert.equal(subject.compare(within), 0);
      assert.equal(subject.compare(overlapend), 0);
      assert.equal(subject.compare(afterend), -1);
    });
  });
});
