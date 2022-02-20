suite('ICAL parse/stringify', function() {

  var icsData;
  var parsed;
  testSupport.defineSample('parserv2.ics', function(data) {
    icsData = data;
    parsed = ICAL.parse(icsData);
  });

  perfTest('#parse', function() {
    var data = ICAL.parse(icsData);
  });

  perfTest('#stringify', function() {
    ICAL.stringify(parsed);
  });
});
