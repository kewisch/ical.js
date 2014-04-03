perfCompareSuite('iterator', function(perf, ICAL) {

  var icsData;

  testSupport.defineSample('parserv2.ics', function(data) {
    icsData = data;
  });

  var parsed;
  var comp;
  var tz;
  var std;
  var rrule;

  suiteSetup(function() {
    parsed = ICAL.parse(icsData);
    comp = new ICAL.Component(parsed);
    tz = comp.getFirstSubcomponent('vtimezone');
    std = tz.getFirstSubcomponent('standard');
    rrule = std.getFirstPropertyValue('rrule');
  });

  perf.test('timezone iterator & first iteration', function() {
    var iterator = rrule.iterator(std.getFirstPropertyValue('dtstart'));
    iterator.next();
  });

});
