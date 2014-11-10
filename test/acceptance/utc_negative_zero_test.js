testSupport.requireICAL();

suite('ics - negative zero', function() {

  var icsData;
  var stringified;

  testSupport.defineSample('utc_negative_zero.ics', function(data) {
    icsData = data;
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


