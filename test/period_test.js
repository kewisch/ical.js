suite('ical/period', function() {

  var start, end, duration;

  setup(function() {
    start = ICAL.Time.fromString("1970-01-02T03:04:05Z");
    end = ICAL.Time.fromString("1970-01-02T03:04:05Z");
    duration = ICAL.Duration.fromString("PT3H2M1S");
  });

  suite('#fromString', function() {
    var assertions = {};

    function verify(string, icalstring, data) {
      var key;
      test('parse: "' + string + '"', function() {
        var subject = ICAL.Period.fromString(string);

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
          var dur = subject.getDuration();

          if ('duration' in data && data.duration) {
            assert.hasProperties(dur, data.duration, 'duration matches calculated');
          } 
          assert.hasProperties(dur, data.calculatedDuration);
        }
        if ('calculatedEnd' in data) {
          var end = subject.getEnd();

          if ('end' in data && data.end) {
            assert.hasProperties(end, data.end, 'duration matches calculated');
          } 
          assert.hasProperties(end, data.calculatedEnd);
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
        hour: 07
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
        hour: 07
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
      end:null,
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
      var subject = ICAL.Period.fromData({
        start: start,
        end: end
      });

      assert.hasProperties(subject.start, start, 'start date');
      assert.hasProperties(subject.end, end, 'end date');
      assert.isNull(subject.duration);
    });
    test('valid start,duration', function() {
      var subject = ICAL.Period.fromData({
        start: start,
        duration: duration,
      });

      assert.hasProperties(subject.start, start, 'start date');
      assert.isNull(subject.end);
      assert.hasProperties(subject.duration, duration, 'duration');
    });

    test('end value exists but is null', function() {
      var subject = ICAL.Period.fromData({
        start: start,
        end: null
      });
      assert.hasProperties(subject.start, start, 'start date');
      assert.isNull(subject.end);
      assert.isNull(subject.duration);
    });

    test('start value exists but is null', function() {
      var subject = ICAL.Period.fromData({
        start: null,
        duration: duration,
      });
      assert.isNull(subject.start);
      assert.isNull(subject.end);
      assert.hasProperties(subject.duration, duration, 'duration');
    });

    test('duration value exists but is null', function() {
      var subject = ICAL.Period.fromData({
        start: start,
        duration: null,
      });
      assert.hasProperties(subject.start, start, 'start date');
      assert.isNull(subject.end);
      assert.isNull(subject.duration);
    });

    test('start,end and duration', function() {
      assert.throws(function() {
        var subject = ICAL.Period.fromData({
          start: start,
          end: end,
          duration: duration
        });
      }, /cannot accept both end and duration/);
    });

    test('start,end and duration but one is null', function() {
      var subject = ICAL.Period.fromData({
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
        var subject = ICAL.Period.fromData({
          start: '1970-01-02T03:04:05Z',
          end: end
        });
      }, /start must be an instance/);
    });
    test('invalid end value', function() {
      assert.throws(function() {
        var subject = ICAL.Period.fromData({
          start: start,
          end: '1970-01-02T03:04:05Z'
        });
      }, /end must be an instance/);
    });
    test('invalid duration value', function() {
      assert.throws(function() {
        var subject = ICAL.Period.fromData({
          start: start,
          duration: 'PT1S'
        });
      }, /duration must be an instance/);
    });
  });

  suite('#toString', function() {
    test('start,end', function() {
        var subject = ICAL.Period.fromData({
          start: start,
          end: end
        });
        assert.equal(subject.toString(), '1970-01-02T03:04:05Z/1970-01-02T03:04:05Z');
    });
    test('start,duration', function() {
        var subject = ICAL.Period.fromData({
          start: start,
          duration: duration
        });
        assert.equal(subject.toString(), '1970-01-02T03:04:05Z/PT3H2M1S');
    });
  });

  suite("generating jCal", function() {
    test("jCal from parser", function() {
      var prop = ICAL.parse.property("FREEBUSY:20140401T010101/PT1H");
      var val = prop[3];
      assert.deepEqual(val, ["2014-04-01T01:01:01", "PT1H"]);
    });
    test("jCal from property", function() {
      var prop = ICAL.Property.fromString("FREEBUSY:20140401T010101/PT1H");
      var val = prop.getFirstValue().toJSON();
      assert.deepEqual(val, ["2014-04-01T01:01:01", "PT1H"]);
    });
  });

  suite("#clone", function() {
    test('cloned start/duration', function() {
      var subjectstart = start.clone();
      var subjectduration = duration.clone();
      var subject1 = ICAL.Period.fromData({start: subjectstart, duration: subjectduration});
      var subject2 = subject1.clone();
      subjectstart.hour++;
      subjectduration.hours++;

      assert.equal(subject1.start.hour, 4);
      assert.equal(subject2.start.hour, 3);

      assert.equal(subject1.duration.hours, 4);
      assert.equal(subject2.duration.hours, 3);
    });
    test('cloned start/end', function() {
      var subjectstart = start.clone();
      var subjectend = end.clone();
      var subject1 = ICAL.Period.fromData({start: subjectstart, end: subjectend});
      var subject2 = subject1.clone();
      subjectstart.hour++;
      subjectend.hour++;

      assert.equal(subject1.start.hour, 4);
      assert.equal(subject2.start.hour, 3);

      assert.equal(subject1.end.hour, 4);
      assert.equal(subject2.end.hour, 3);
    });
    test('cloned empty object', function() {
      // most importantly, this shouldn't throw.
      var subject1 = ICAL.Period.fromData();
      var subject2 = subject1.clone();

      assert.equal(subject1.start, subject2.start);
      assert.equal(subject1.end, subject2.end);
      assert.equal(subject1.duration, subject2.duration);
    });
  });
});
