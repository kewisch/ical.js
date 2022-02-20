suite('ICAL parse/stringify', function() {

  var icsData;
  var parsed;
  suiteSetup(async function() {
    icsData = await testSupport.loadSample('parserv2.ics');
    parsed = ICAL.parse(icsData);
  });

  perfTest('#parse', function() {
    var data = ICAL.parse(icsData);
  });

  perfTest('#stringify', function() {
    ICAL.stringify(parsed);
  });
});
