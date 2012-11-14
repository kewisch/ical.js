suite('ical/duration', function() {

  suite('#fromString', function() {
    var assertions = {};

    function verify(string, data) {
      var key;
      test('parse: "' + string + '"', function() {
        var subject = ICAL.Period.fromString(string);

        if ('start' in data) {
          assert.hasProperties(
            subject.start,
            data.start,
            'start property'
          );
        }

        if ('end' in data) {
          assert.hasProperties(
            subject.end,
            data.end,
            'end property'
          );
        }

        if ('duration' in data) {
          assert.hasProperties(
            subject.duration,
            data.duration,
            'duration property'
          );
        }
      });
    }

    verify('19970101T180000Z/19970102T070000Z', {
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

    verify('19970101T180000Z/PT5H30M', {
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

