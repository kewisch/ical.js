testSupport.requireICAL();

suite('ical/parser', function() {

  var icsData;

  suite('basic event', function() {
    testSupport.defineSample('blank_description.ics', function(data) {
      icsData = data;
    });

    function strip(text) {
      var val = text.replace(/\\r/g, '');
      return val.trim();
    }

    test('undecorated', function() {
      // round trip
      var json = JSON.parse(ICAL.toJSONString(icsData));

      // turn back into ical file
      var icsOut = ICAL.toIcalString(json);

      // should be same as input after stripping
      assert.equal(strip(icsData), strip(icsOut));
    });

    test('decorated', function() {
      // decorate
      var decorated = ICAL.toJSON(icsData, true);
      var json = JSON.stringify(
        decorated.undecorate(), ICAL.JSONStringifyRules
      );
    });

  });
});
