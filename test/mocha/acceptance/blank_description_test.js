testSupport.requireICAL();

suite('ics - blank description', function() {

  var icsData;
  var stringified;

  testSupport.defineSample('blank_description.ics', function(data) {
    icsData = data;
  });

  test('summary', function() {
    // just verify it does not crash
    stringified = ICAL.toJSONString(icsData);
  });
});
