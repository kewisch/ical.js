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
    var component = new ICAL.icalcomponent(result);
    var vevent = component.getFirstSubcomponent(
      'VEVENT'
    );

    var recur = vevent.getFirstPropertyValue(
      'RRULE'
    );

    var start = vevent.getFirstPropertyValue(
      'DTSTART'
    );

    var key;

    var iter = recur.iterator(start);
    var limit = 100;
    while (limit) {
      limit--;
    }

  });
});

