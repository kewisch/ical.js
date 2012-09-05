testSupport.requireICAL();

suite('ics - negative zero', function() {

  var icsData;
  var stringified;

  testSupport.defineSample('utc_negative_zero.ics', function(data) {
    icsData = data;
  });

  test('summary', function() {
    var result = ICAL.parse(icsData);
    var component = new ICAL.icalcomponent(result);
    var vtimezone = component.getFirstSubcomponent(
      'VTIMEZONE'
    );

    var standard = vtimezone.getFirstSubcomponent(
      'STANDARD'
    );

    var props = standard.getAllProperties();
    var offset = props[1].data;

    assert.equal(
      offset.type,
      'UTC-OFFSET'
    );

    assert.equal(
      offset.factor,
      -1,
      'offset'
    );
  });
});


