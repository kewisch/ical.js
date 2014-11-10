suite('timezone_service', function() {
  var icsData;
  testSupport.defineSample('timezones/America/Los_Angeles.ics', function(data) {
    icsData = data;
  });

  var subject;
  setup(function() {
    subject = ICAL.TimezoneService;
    subject.reset();
  });

  teardown(function() {
    subject.reset();
  });

  test('utc zones', function() {
    var zones = ['Z', 'UTC', 'GMT'];
    zones.forEach(function(tzid) {
      assert.ok(subject.has(tzid), tzid + ' should exist');
      assert.equal(subject.get(tzid), ICAL.Timezone.utcTimezone);
    });
  });

  test('#reset', function() {
    var name = 'ZFOO';
    subject.register(name, ICAL.Timezone.utcTimezone);
    assert.isTrue(subject.has(name), 'should have set ' + name);

    subject.reset();
    assert.isFalse(subject.has(name), 'removes ' + name + ' after reset');
  });

  suite('register zones', function() {
    test('when it does not exist', function() {
      var name = 'test';
      assert.isFalse(subject.has(name));

      subject.register(name, ICAL.Timezone.localTimezone);
      assert.isTrue(subject.has(name), 'is present after set');
      assert.equal(
        subject.get(name),
        ICAL.Timezone.localTimezone
      );

      subject.remove(name);
      assert.isFalse(subject.has(name), 'can remove zones');
    });

    test('with invalid type', function() {
      assert.throws(function() {
        subject.register('zzz', 'fff');
      }, TypeError);
    });

    test('override', function() {
      // don't do this but you can if you want to shoot
      // yourself in the foot.
      subject.register('Z', ICAL.Timezone.localTimezone);

      assert.equal(
        subject.get('Z'),
        ICAL.Timezone.localTimezone
      );
    });

    test('using a component', function() {
      var parsed = ICAL.parse(icsData);
      var comp = new ICAL.Component(parsed);
      var vtimezone = comp.getFirstSubcomponent('vtimezone');
      var tzid = vtimezone.getFirstPropertyValue('tzid');

      subject.register(vtimezone);

      assert.isTrue(subject.has(tzid), 'successfully registed with component');

      var zone = subject.get(tzid);

      assert.instanceOf(zone, ICAL.Timezone);
      assert.equal(zone.tzid, tzid);
    });
  });

});
