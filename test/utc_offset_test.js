suite('ICAL.UtcOffset', function() {
  test('#clone', function() {
    var subject = new ICAL.UtcOffset({ hours: 5, minutes: 6 });
    assert.equal(subject.toString(), "+05:06");

    var cloned = subject.clone();
    subject.hours = 6;

    assert.equal(cloned.toString(), "+05:06");
    assert.equal(subject.toString(), "+06:06");
  });

  test('#toICALString', function() {
    var subject = new ICAL.UtcOffset({ hours: 5, minutes: 6 });
    assert.equal(subject.toString(), "+05:06");
    assert.equal(subject.toICALString(), "+0506");
  });

  suite('#normalize', function() {
    test('minute overflow', function() {
      assert.hasProperties(new ICAL.UtcOffset({
        minutes: 120
      }), {
        hours: 2, minutes: 0, factor: 1
      });
    });
    test('minutes underflow', function() {
      assert.hasProperties(new ICAL.UtcOffset({
        minutes: -120
      }), {
        hours: 2, minutes: 0, factor: -1
      });
    });
    test('minutes underflow with hours', function() {
      assert.hasProperties(new ICAL.UtcOffset({
        hours: 2,
        minutes: -120
      }), {
        hours: 0, minutes: 0, factor: 1
      });
    });
    test('hours overflow', function() {
      assert.hasProperties(new ICAL.UtcOffset({
        hours: 15,
        minutes: 30
      }), {
        hours: 11, minutes: 30, factor: -1
      });
    });
    test('hours underflow', function() {
      assert.hasProperties(new ICAL.UtcOffset({
        hours: 13,
        minutes: 30,
        factor: -1
      }), {
        hours: 13, minutes: 30, factor: 1
      });
    });
    test('hours double underflow', function() {
      assert.hasProperties(new ICAL.UtcOffset({
        hours: 40,
        minutes: 30,
        factor: -1
      }), {
        hours: 13, minutes: 30, factor: 1
      });
    });
    test('negative zero utc offset', function() {
      assert.hasProperties(new ICAL.UtcOffset({
        hours: 0,
        minutes: 0,
        factor: -1
      }), {
        hours: 0, minutes: 0, factor: -1
      });

    });
  });

  suite('#compare', function() {
    test('greater', function() {
      var a = new ICAL.UtcOffset({ hours: 5, minutes: 1 });
      var b = new ICAL.UtcOffset({ hours: 5, minutes: 0 });
      assert.equal(a.compare(b), 1);
    });
    test('equal', function() {
      var a = new ICAL.UtcOffset({ hours: 15, minutes: 0 });
      var b = new ICAL.UtcOffset({ hours: -12, minutes: 0 });
      assert.equal(a.compare(b), 0);
    });
    test('equal zero', function() {
      var a = new ICAL.UtcOffset({ hours: 0, minutes: 0, factor: -1 });
      var b = new ICAL.UtcOffset({ hours: 0, minutes: 0 });
      assert.equal(a.compare(b), 0);
    });
    test('less than', function() {
      var a = new ICAL.UtcOffset({ hours: 5, minutes: 0 });
      var b = new ICAL.UtcOffset({ hours: 5, minutes: 1 });
      assert.equal(a.compare(b), -1);
    });
  });
  
  suite('from/toSeconds', function() {
    test('static', function() {
      var subject = ICAL.UtcOffset.fromSeconds(3661);
      assert.equal(subject.toString(), '+01:01');
      assert.equal(subject.toSeconds(), 3660);
    });
    test('instance', function() {
      var subject = ICAL.UtcOffset.fromSeconds(3661);
      subject.fromSeconds(-7321);
      assert.equal(subject.toString(), '-02:02');
      assert.equal(subject.toSeconds(), -7320);
    });
  });
});
