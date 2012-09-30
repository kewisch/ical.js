testSupport.requireICAL();
testSupport.helper('factory.js');

suite('ical/component', function() {

  var data;
  var icsData;
  var subject;
  var factory;

  testSupport.defineSample('blank_description.ics', function(data) {
    icsData = data;
  });

  setup(function() {
    subject = new ICAL.icalcomponent(ICAL.parse(icsData));
    factory = testSupport.factory;
  });

  function contains(haystack, needle) {
    return haystack.indexOf(needle) !== -1;
  }

  // taken from xpc-shell test
  test('sanity', function() {
    var dtStartStr   =  'DTSTART:20110101T121314';
    var alarmCompStr = ['BEGIN:VALARM',
                        'END:VALARM'].join('\n');
    var eventStr     = ['BEGIN:VEVENT',
                        dtStartStr,
                        alarmCompStr,
                        'END:VEVENT'].join('\n');

    var event = ICAL.icalcomponent.fromString(eventStr);

    var event2 = event.clone();
    var rawEvent = ICAL.parse(eventStr);

    assert.equal(event.toString(), event2.toString());

    assert.equal(event.toString(), eventStr);

    var alarmComp = event.getFirstSubcomponent('VALARM');
    assert.equal(alarmComp.toString(), alarmCompStr);

    var alarmComp2 = event.getAllSubcomponents('VALARM');
    assert.equal(alarmComp2.length, 1);
    assert.equal(alarmComp2[0].toString(), alarmCompStr);

    assert.isTrue(event.hasProperty('DTSTART'));
    var dtstart = event.getFirstProperty('DTSTART');
    assert.equal(event.getFirstProperty('DTEND'), null);

    var allDtProps = event.getAllProperties('DTSTART');
    assert.equal(allDtProps.length, 1);
    assert.equal(allDtProps[0].toString(), dtStartStr);

    event.removeSubcomponent('VALARM');
    assert.equal(event.getFirstSubcomponent('VALARM'), null);
    assert.notEqual(event.toString(), event2.toString());

    assert.isFalse(event.hasProperty('X-FOO'));
    event.addPropertyWithValue('X-FOO', 'BAR');
    assert.isTrue(event.hasProperty('X-FOO'));

    var xprop = event.getFirstProperty('X-FOO');
    assert.equal(xprop.getStringValue(), 'BAR');

    event.removeProperty('X-FOO');
    assert.isFalse(event.hasProperty('X-FOO'));
    var xprop2 = ICAL.icalproperty.fromData({
        name: 'X-BAR',
        value: 'BAZ'
    });
    event.addProperty(xprop2);
    assert.isTrue(event.hasProperty('X-BAR'));
    assert.equal(event.getFirstProperty('X-BAR'), xprop2);
    assert.equal(xprop2.parent, event);

    assert.notEqual(event.toString(), event2.toString());

    event.clearAllProperties();
    assert.equal(event.getFirstProperty(), null);
    assert.equal(event.getAllProperties().length, 0);
    assert.isFalse(event.hasProperty('X-BAR'));

    // TODO getFirstPropertyValue ?

    assert.notEqual(event.toString(), event2.toString());
  });

  suite('#initialize', function() {
    test('#fromData', function() {
      var prop = factory.propUUID();
      var comp = factory.vevent(prop);

      var compObj = new ICAL.icalcomponent(comp, null);

      // check to string
      var obj = compObj.toString();
      assert.ok(obj, 'stringify component');
      assert.include(obj, prop.value[0]);
      assert.include(obj, 'BEGIN:VEVENT');
      assert.include(obj, 'END:VEVENT');
    });
  });

  suite('#getFirstSubcomponent', function() {
    test('with given type', function() {
      var vevent = subject.getFirstSubcomponent('VEVENT');
      assert.equal(vevent.name, 'VEVENT');
    });
  });

  test('#hasProperty', function() {
    assert.isTrue(subject.hasProperty('PRODID'));
    assert.isFalse(subject.hasProperty('NOT_HERE'));
  });

  test('#getFirstProperty', function() {
    var prop = subject.getFirstProperty('PRODID');
    assert.equal(prop.name, 'PRODID');
  });

  test('#getFirstPropertyValue', function() {
    var prop = subject.getFirstPropertyValue('PRODID');
    var value = prop.data.value;

    assert.ok(value);
    assert.ok(value[0]);
    assert.include(value[0], 'Google');
  });

  test('#removeProperty', function() {
    var out = subject.toString();
    assert.include(out, 'PRODID');

    subject.removeProperty('PRODID');
    assert.ok(!subject.properties['PRODID']);

    // verify its actually removed in output
    var out = subject.toString();

    assert.ok(
      out.indexOf('PRODID') === -1
    );
  });

  test('#clearAllProperties', function() {
    var props = Object.keys(
      subject.properties
    );

    var out = subject.toString();

    props.forEach(function(key) {
      assert.ok(!contains(props), 'should remove ' + key + ' from output');
    });
  });

  test('#updatePropertyWithValue', function() {
    // add a property
    subject.addPropertyWithValue('X-FOO', '1');
    subject.updatePropertyWithValue('X-FOO', '2');

    var props = subject.getAllProperties('X-FOO');
    assert.length(props, 1);

    var value = props[0].getFirstValue().data.value[0];

    assert.equal(value, '2');
  });

  test('#addPropertyWithValue', function() {
    subject.addPropertyWithValue('X-FOONAME', 'value');

    var value = subject.getFirstPropertyValue('X-FOONAME');
    var out = subject.toString();

    assert.ok(contains(out, 'X-FOONAME'));

    var addedProp = subject.getFirstPropertyValue('X-FOONAME');
    assert.isTrue(subject.hasProperty('X-FOONAME'));
    assert.deepEqual(addedProp.data.value, ['value']);
  });

  test('#toJSON', function() {
    var string = JSON.stringify(subject);
    var json = JSON.parse(string);
    var newCom = new ICAL.icalcomponent(json);

    assert.equal(newCom.toString(), subject.toString());
  });

  test('#addSubcomponent', function() {
    var vevent = factory.veventComp();
    var veventOut = vevent.toString();

    // add to main
    var vcal = factory.vcalComp();

    vcal.addSubcomponent(vevent);

    var vcalOut = vcal.toString();

    assert.ok(vcalOut);

    assert.include(vcalOut, 'BEGIN:VCALENDAR');
    assert.include(vcalOut, veventOut);
    assert.include(vcalOut, 'END:VCALENDAR');
  });

  test('#removeSubcomponent', function() {
    var vevent = factory.veventComp();
    var vcal = factory.vcalComp();

    vcal.addSubcomponent(vevent);
    vcal.removeSubcomponent('VEVENT');

    var out = vcal.toString();

    assert.ok(
      !contains(vevent.toString()),
      'should have removed subcomponents from ical out'
    );
  });

  test('#undecorate', function() {
    var vevent = factory.veventComp();
    var vcal = factory.vcalComp();

    vcal.addSubcomponent(vevent);
    var out = vcal.undecorate();

    assert.equal(out.name, 'VCALENDAR');
    assert.equal(out.type, 'COMPONENT');

    var event = out.value[0];
    assert.equal(event.name, 'VEVENT');
    assert.equal(event.type, 'COMPONENT');

    assert.deepEqual(
      event,
      factory.vevent(factory.propUUID())
    );
  });

});
