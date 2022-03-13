suite('ics - blank description', function() {
  let icsData;

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('blank_description.ics');
  });

  test('summary', function() {
    // just verify it can parse blank lines
    let result = ICAL.parse(icsData);
  });
});
