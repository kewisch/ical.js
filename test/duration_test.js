testSupport.requireICAL();

suite('ical/duration', function() {
  test('#clone', function() {
    var subject = new ICAL.Duration.fromData({
      weeks: 1,
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      isNegative: true
    });

    var expected = {
      weeks: 1,
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      isNegative: true
    };

    var expected2 = {
      weeks: 6,
      days: 7,
      hours: 8,
      minutes: 9,
      seconds: 10,
      isNegative: true
    };

    var subject2 = subject.clone();
    assert.hasProperties(subject, expected, 'base object unchanged');
    assert.hasProperties(subject2, expected, 'cloned object unchanged');

    for (var k in expected2) {
        subject2[k] = expected2[k];
    }

    assert.hasProperties(subject, expected, 'base object unchanged');
    assert.hasProperties(subject2, expected2, 'cloned object changed');
  });

  test('#reset', function() {
    var expected = {
      weeks: 1,
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      isNegative: true
    };
    var subject = new ICAL.Duration(expected);
    assert.hasProperties(subject, expected);

    subject.reset();

    assert.hasProperties(subject, {
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isNegative: false
    });

    assert.equal(subject.toString(), "PT0S");
  });

  suite('#normalize', function() {
    function verify(name, str, data) {
      test(name, function() {
        var subject = new ICAL.Duration();
        for (var k in data) {
          subject[k] = data[k];
        }
        subject.normalize();
        assert.equal(subject.toString(), str);
        assert.equal(subject.toICALString(), str);
      });
    }

    verify('weeks and day => days', 'P50D', {
      weeks: 7,
      days: 1
    });
    verify('days => week' , 'P2W', {
      days: 14
    });
    verify('days and weeks => week' , 'P4W', {
      weeks: 2,
      days: 14
    });
    verify('seconds => everything', 'P1DT1H1M1S', {
      seconds: 86400 + 3600 + 60 + 1
    });
  });

  suite("#compare", function() {
    function verify(str, a, b, cmp) {
      test(str, function() {
        var dur_a = new ICAL.Duration.fromString(a);
        var dur_b = new ICAL.Duration.fromString(b);
        assert.equal(dur_a.compare(dur_b), cmp);
      });
    }

    verify('a>b', 'PT3H', 'PT1S', 1);
    verify('a<b', 'PT2M', 'P1W', -1);
    verify('a=b', 'P1W', 'P7D', 0);
    verify('negative/positive', 'P2H', '-P2H', 1);
  });

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
        var subject = new ICAL.Duration.fromString(string);
        assert.hasProperties(subject, expected);
      });
    }

    function verifyFail(string, errorParam) {
      test('expected failure: ' + string, function() {
        assert.throws(function() {
          new ICAL.Duration.fromString(string);
        }, errorParam);
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

    verifyFail('PT1WH', /Missing number before "H"/);
    verifyFail('PT1WsomeH', /Invalid number "some" before "H"/);
  });
});
