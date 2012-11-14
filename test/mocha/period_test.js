suite('ical/period', function() {

  suite('#fromString', function() {
    var assertions = {};

    function verify(string, data) {
      var key;
      test('parse: "' + string + '"', function() {
        var subject = ICAL.Period.fromString(string);

        if ('start' in data) {
          assert.instanceOf(subject.start, ICAL.Time);
          assert.hasProperties(
            subject.start,
            data.start,
            'start property'
          );
        }

        if ('end' in data) {
          assert.instanceOf(subject.end, ICAL.Time);
          assert.hasProperties(
            subject.end,
            data.end,
            'end property'
          );
        }

        if (('duration' in data) && data['duration']) {
          assert.instanceOf(subject.duration, ICAL.Duration);
          assert.hasProperties(
            subject.duration,
            data.duration,
            'duration property'
          );
        }
      });
    }

    verify('1997-01-01T18:00:00Z/1997-01-02T07:00:00Z', {
      duration: null,

      start: {
        year: 1997,
        month: 1,
        day: 1,
        hour: 18,
        minute: 0,
        second: 0
      },

      end: {
        year: 1997,
        month: 1,
        day: 2,
        hour: 07
      }
    });

    verify('1997-01-01T18:00:00Z/PT5H30M', {
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
      }
    });

  });

});

