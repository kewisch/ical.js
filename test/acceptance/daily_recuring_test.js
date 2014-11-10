testSupport.requireICAL();

suite('ics - blank description', function() {

  var icsData;
  var stringified;

  testSupport.defineSample('daily_recur.ics', function(data) {
    icsData = data;
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

    var key;

    var iter = recur.iterator(start);
    var limit = 10;
    while (limit) {
      iter.next();
      limit--;
    }
  });
});

