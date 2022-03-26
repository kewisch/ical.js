suite('iterator', function() {

  let icsData;

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('parserv2.ics');
  });

  let parsed;
  let comp;
  let tz;
  let std;
  let rrule;

  suiteSetup(function() {
    parsed = ICAL.parse(icsData);
    comp = new ICAL.Component(parsed);
    tz = comp.getFirstSubcomponent('vtimezone');
    std = tz.getFirstSubcomponent('standard');
    rrule = std.getFirstPropertyValue('rrule');
  });

  perfTest('timezone iterator & first iteration', function() {
    let iterator = rrule.iterator(std.getFirstPropertyValue('dtstart'));
    iterator.next();
  });

});
