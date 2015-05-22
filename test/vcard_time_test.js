suite('vcard time', function() {
  // Lots of things are also covered in the design test

  suite('initialization', function() {
    test('default icaltype', function() {
      var subject = ICAL.VCardTime.fromDateAndOrTimeString('2015-01-01');
      assert.equal(subject.icaltype, 'date-and-or-time');
    });

    test('clone', function() {
      var orig = ICAL.VCardTime.fromDateAndOrTimeString('2015-01-02T03:04:05-08:00', 'date-time');
      var subject = orig.clone();

      orig.day++;
      orig.month++;
      orig.year++;
      orig.hour++;
      orig.minute++;
      orig.second++;
      orig.zone = ICAL.Timezone.utcTimezone;

      assert.equal(orig.toString(), '2016-02-03T04:05:06Z');
      assert.equal(subject.toString(), '2015-01-02T03:04:05-08:00');
      assert.equal(subject.icaltype, 'date-time');
      assert.equal(subject.zone.toString(), '-08:00');
    });
  });

  suite('#utcOffset', function() {
    testSupport.useTimezones('America/New_York');

    test('floating and utc', function() {
      var subject = ICAL.VCardTime.fromDateAndOrTimeString('2015-01-02T03:04:05', 'date-time');
      subject.zone = ICAL.Timezone.utcTimezone;
      assert.equal(subject.utcOffset(), 0);

      subject.zone = ICAL.Timezone.localTimezone;
      assert.equal(subject.utcOffset(), 0);
    });
    test('ICAL.UtcOffset', function() {
      var subject = ICAL.VCardTime.fromDateAndOrTimeString('2015-01-02T03:04:05-08:00', 'date-time');
      assert.equal(subject.utcOffset(), -28800);
    });
    test('Olson timezone', function() {
      var subject = ICAL.VCardTime.fromDateAndOrTimeString('2015-01-02T03:04:05');
      subject.zone = ICAL.TimezoneService.get('America/New_York');
      assert.equal(subject.utcOffset(), -18000);
    });
  });

  suite('#toString', function() {
    testSupport.useTimezones('America/New_York');

    test('invalid icaltype', function() {
      var subject = ICAL.VCardTime.fromDateAndOrTimeString('2015-01-01', 'ballparkfigure');
      assert.isNull(subject.toString());
    });
    test('invalid timezone', function() {
      var subject = ICAL.VCardTime.fromDateAndOrTimeString('2015-01-01T01:01:01');
      subject.zone = null;
      assert.equal(subject.toString(), '2015-01-01T01:01:01');
    });
    test('Olson timezone', function() {
      var subject = ICAL.VCardTime.fromDateAndOrTimeString('2015-01-02T03:04:05');
      subject.zone = ICAL.TimezoneService.get('America/New_York');
      assert.equal(subject.toString(), '2015-01-02T03:04:05-05:00');
    });
  });
});
