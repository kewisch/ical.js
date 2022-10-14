suite('ics test', function() {
  var icsData;

  testSupport.defineSample('forced_types.ics', function(data) {
    icsData = data;
  });

  test('force type', function() {
    // just verify it can parse forced types
    var result = ICAL.parse(icsData);
    var component = new ICAL.Component(result);
    var vevent = component.getFirstSubcomponent(
      'vevent'
    );

    var start = vevent.getFirstPropertyValue('dtstart');

    assert.isTrue(start.isDate, 'is date type');
  });
});
