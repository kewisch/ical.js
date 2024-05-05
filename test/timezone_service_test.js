suite('timezone_service', function() {
  let icsData;
  suiteSetup(async function() {
    icsData = await testSupport.loadSample('timezones/America/Los_Angeles.ics');
  });

  let subject;
  setup(function() {
    subject = ICAL.TimezoneService;
    subject.reset();
  });

  teardown(function() {
    subject.reset();
  });

  test('init', function() {
    // This tests the default behavior when the time zone service is first initialized
    subject._hard_reset();
    assert.isFalse(subject.has('UTC'));

    subject._hard_reset();
    assert.equal(subject.count, 0);
    assert.isFalse(subject.has('UTC'));

    subject._hard_reset();
    assert.isNull(subject.remove('bogus'));
    assert.isFalse(subject.has('UTC'));

    // Getting a timezone will initialize the service and set UTC
    subject._hard_reset();
    assert.isUndefined(subject.get('bogus'));
    assert.isTrue(subject.has('UTC'));
  });

  test('utc zones', function() {
    let zones = ['Z', 'UTC', 'GMT'];
    zones.forEach(function(tzid) {
      assert.ok(subject.has(tzid), tzid + ' should exist');
      assert.equal(subject.get(tzid), ICAL.Timezone.utcTimezone);
    });
  });

  test('#reset', function() {
    let name = 'ZFOO';
    subject.register(name, ICAL.Timezone.utcTimezone);
    assert.isTrue(subject.has(name), 'should have set ' + name);

    subject.reset();
    assert.isFalse(subject.has(name), 'removes ' + name + ' after reset');

    assert.equal(subject.count, 3);
  });

  suite('register zones', function() {
    test('when it does not exist', function() {
      let name = 'test';
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
        let comp = new ICAL.Component('vtoaster');
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
      let parsed = ICAL.parse(icsData);
      let comp = new ICAL.Component(parsed);
      let vtimezone = comp.getFirstSubcomponent('vtimezone');
      let tzid = vtimezone.getFirstPropertyValue('tzid');

      assert.equal(subject.count, 3);
      subject.register(vtimezone);
      assert.equal(subject.count, 4);

      assert.isTrue(subject.has(tzid), 'successfully registed with component');

      let zone = subject.get(tzid);

      assert.instanceOf(zone, ICAL.Timezone);
      assert.equal(zone.tzid, tzid);
    });
  });
});
