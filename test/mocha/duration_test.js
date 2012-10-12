testSupport.requireICAL();

suite('ical/duration', function() {

  suite('#fromString', function() {
    var assertions = {};
    var base = {
      weeks: 0,
      days: 0,
      minutes: 0,
      seconds: 0,
      isNegative: false
    };

    function verify(string, data) {
      var expected = {};
      var key;


      for (key in base) {
        expected[key] = base[key];
      }

      for (key in data) {
        expected[key] = data[key];
      }

      test('parse: "' + string + '"', function() {
        var subject = ICAL.icalduration.fromString(string);
        assert.hasProperties(subject, expected);
      });
    }

    verify('P7W', {
      weeks: 7
    });

    verify('PT1H0M0S', {
      hours: 1
    });

    verify('PT15M', {
      minutes: 15
    });

    verify('P15DT5H0M20S', {
      days: 15,
      hours: 5,
      seconds: 20
    });

    verify('-P0DT0H30M0S', {
      isNegative: true,
      weeks: 0,
      days: 0,
      minutes: 30,
      seconds: 0
    });
  });

});
