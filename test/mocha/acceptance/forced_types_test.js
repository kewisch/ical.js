testSupport.requireICAL();

suite('ics test', function() {

  var icsData;
  var stringified;

  testSupport.defineSample('forced_types.ics', function(data) {
    icsData = data;
  });

  test('force type', function() {
    // just verify it can parse forced types
    var result = ICAL.parse(icsData);
    var component = new ICAL.icalcomponent(result);
    var vevent = component.getFirstSubcomponent(
      'VEVENT'
    );

    var start = vevent.getFirstPropertyValue('DTSTART');

    assert.isTrue(start.isDate, 'is date type');
  });
});


