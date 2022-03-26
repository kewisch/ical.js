suite('ics - blank description', function() {
  let icsData;

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('daily_recur.ics');
  });

  test('summary', function() {
    // just verify it can parse blank lines
    let result = ICAL.parse(icsData);
    let component = new ICAL.Component(result);
    let vevent = component.getFirstSubcomponent(
      'vevent'
    );

    let recur = vevent.getFirstPropertyValue(
      'rrule'
    );

    let start = vevent.getFirstPropertyValue(
      'dtstart'
    );

    let iter = recur.iterator(start);
    let limit = 10;
    while (limit) {
      iter.next();
      limit--;
    }
  });
});
