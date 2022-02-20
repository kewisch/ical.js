suite('iterator', function() {

  var icsData;

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('parserv2.ics');
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

  perfTest('timezone iterator & first iteration', function() {
    var iterator = rrule.iterator(std.getFirstPropertyValue('dtstart'));
    iterator.next();
  });

});
