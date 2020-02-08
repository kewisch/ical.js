testSupport.requireICAL();

suite('ics - blank description', function() {
  var icsData;

  testSupport.defineSample('blank_description.ics', function(data) {
    icsData = data;
  });

  test('summary', function() {
    // just verify it can parse blank lines
    var result = ICAL.parse(icsData);
  });
});
