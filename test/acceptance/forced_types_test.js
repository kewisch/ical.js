suite('ics test', function() {
  let icsData;

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('forced_types.ics');
  });

  test('force type', function() {
    // just verify it can parse forced types
    let result = ICAL.parse(icsData);
    let component = new ICAL.Component(result);
    let vevent = component.getFirstSubcomponent(
      'vevent'
    );

    let start = vevent.getFirstPropertyValue('dtstart');

    assert.isTrue(start.isDate, 'is date type');
  });
});
