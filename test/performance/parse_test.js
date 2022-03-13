suite('ICAL parse/stringify', function() {

  let icsData;
  let parsed;
  suiteSetup(async function() {
    icsData = await testSupport.loadSample('parserv2.ics');
    parsed = ICAL.parse(icsData);
  });

  perfTest('#parse', function() {
    let data = ICAL.parse(icsData);
  });

  perfTest('#stringify', function() {
    ICAL.stringify(parsed);
  });
});
