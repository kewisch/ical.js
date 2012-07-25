testSupport.requireICAL();

suite('ics - long summary', function() {

  var icsData;
  var json;

  testSupport.defineSample('long_summary.ics', function(data) {
    icsData = data;
  });

  suiteSetup(function() {
    json = ICAL.toJSONString(icsData, true);
  });

  test('result', function() {
  });

});
