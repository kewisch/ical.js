suite('ics - blank description', function() {
  var icsData;

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('blank_description.ics');
  });

  test('summary', function() {
    // just verify it can parse blank lines
    var result = ICAL.parse(icsData);
  });
});
