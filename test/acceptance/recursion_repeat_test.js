suite('ics - RRULE making event duplicate', function() {
  var icsData;

  testSupport.defineSample('recursion_repeat.ics', function(data) {
    icsData = data;
  });

  test('expanding malformatted recurring event', function(done) {
    // just verify it can parse RRULES that duplicate the start date
    var parser = new ICAL.ComponentParser();
    var primary;
    var exceptions = [];

    var expectedDates = [
      new Date(Date.UTC(2018, 07, 03, 19)),
      new Date(Date.UTC(2018, 08, 07, 19))
    ];

    parser.onevent = function(event) {
      if (event.isRecurrenceException()) {
        exceptions.push(event);
      } else {
        primary = event;
      }
    };

    parser.oncomplete = function() {
      exceptions.forEach(function(item) {
        primary.relateException(item);
      });

      var iter = primary.iterator();
      var next;
      var dates = [];
      while ((next = iter.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(
        dates,
        expectedDates
      );

      done();
    };

    parser.process(icsData);
  });
});
