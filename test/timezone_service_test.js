suite('timezone_service', function() {
  var icsData;
  suiteSetup(async function() {
    icsData = await testSupport.loadSample('timezones/America/Los_Angeles.ics');
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

    assert.equal(subject.count, 3);
  });

  suite('register zones', function() {
    test('when it does not exist', function() {
      var name = 'test';
      assert.isFalse(subject.has(name));

      assert.equal(subject.count, 3);
      subject.register(name, ICAL.Timezone.localTimezone);
      assert.equal(subject.count, 4);
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
      }, "timezone must be ICAL.Timezone");
    });
    test('with only invalid component', function() {
      assert.throws(function() {
        var comp = new ICAL.Component('vtoaster');
        subject.register(comp);
      }, "timezone must be ICAL.Timezone");
    });

    test('override', function() {
      // don't do this but you can if you want to shoot
      // yourself in the foot.
      assert.equal(subject.count, 3);
      subject.register('Z', ICAL.Timezone.localTimezone);

      assert.equal(
        subject.get('Z'),
        ICAL.Timezone.localTimezone
      );
      assert.equal(subject.count, 3);
    });

    test('using a component', function() {
      var parsed = ICAL.parse(icsData);
      var comp = new ICAL.Component(parsed);
      var vtimezone = comp.getFirstSubcomponent('vtimezone');
      var tzid = vtimezone.getFirstPropertyValue('tzid');

      assert.equal(subject.count, 3);
      subject.register(vtimezone);
      assert.equal(subject.count, 4);

      assert.isTrue(subject.has(tzid), 'successfully registed with component');

      var zone = subject.get(tzid);

      assert.instanceOf(zone, ICAL.Timezone);
      assert.equal(zone.tzid, tzid);
    });
  });
});
