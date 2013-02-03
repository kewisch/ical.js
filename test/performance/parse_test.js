perfCompareSuite('ICAL parse/stringify', function(perf, ICAL) {

  var icsData;
  var parsed;
  testSupport.defineSample('parserv2.ics', function(data) {
    icsData = data;
    parsed = ICAL.parse(icsData);
  });

  perf.test('#parse', function() {
    var data = ICAL.parse(icsData);
  });

  perf.test('#stringify', function() {
    ICAL.stringify(parsed);
  });

});
