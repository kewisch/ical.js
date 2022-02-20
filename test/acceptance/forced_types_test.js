suite('ics test', function() {
  var icsData;

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('forced_types.ics');
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
