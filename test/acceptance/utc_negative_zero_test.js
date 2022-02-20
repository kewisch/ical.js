suite('ics - negative zero', function() {
  var icsData;

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('utc_negative_zero.ics');
  });

  test('summary', function() {
    var result = ICAL.parse(icsData);
    var component = new ICAL.Component(result);
    var vtimezone = component.getFirstSubcomponent(
      'vtimezone'
    );

    var standard = vtimezone.getFirstSubcomponent(
      'standard'
    );

    var props = standard.getAllProperties();
    var offset = props[1].getFirstValue();

    assert.equal(
      offset.factor,
      -1,
      'offset'
    );
  });
});
