suite('google birthday events', function() {
  let icsData;

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('google_birthday.ics');
  });

  test('expanding malformatted recurring event', function(done) {
    // just verify it can parse forced types
    let parser = new ICAL.ComponentParser();
    let primary;
    let exceptions = [];

    let expectedDates = [
      new Date(2012, 11, 10),
      new Date(2013, 11, 10),
      new Date(2014, 11, 10)
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

      let iter = primary.iterator();
      let next;
      let dates = [];
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
