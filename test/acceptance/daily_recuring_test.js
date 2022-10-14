suite('ics - blank description', function() {
  var icsData;

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('daily_recur.ics');
  });

  test('summary', function() {
    // just verify it can parse blank lines
    var result = ICAL.parse(icsData);
    var component = new ICAL.Component(result);
    var vevent = component.getFirstSubcomponent(
      'vevent'
    );

    var recur = vevent.getFirstPropertyValue(
      'rrule'
    );

    var start = vevent.getFirstPropertyValue(
      'dtstart'
    );

    var iter = recur.iterator(start);
    var limit = 10;
    while (limit) {
      iter.next();
      limit--;
    }
  });
});
