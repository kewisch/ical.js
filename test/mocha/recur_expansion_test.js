suite('recur_expansion', function() {
  var component;
  var subject;
  var icsData;

  testSupport.defineSample('recur_instances.ics', function(data) {
    icsData = data;
  });

  setup(function(done) {
    var primary;
    var exceptions = [];

    var parse = new ICAL.ComponentParser();

    parse.onevent = function(event) {
      if (event.isRecurrenceException()) {
        exceptions.push(event);
      } else {
        primary = event;
      }
    };

    parse.oncomplete = function() {
      exceptions.forEach(primary.relateException, primary);
      subject = new ICAL.RecurExpansion(primary.component, primary.startDate);
      done();
    }

    parse.process(icsData);
  });

  test('initialization', function() {
    assert.ok(subject._rules);

    assert.deepEqual(
      new Date(2012, 9, 2, 10),
      subject.currentTime.toJSDate()
    );

    assert.deepEqual(subject._ruleIterators, []);
    assert.ok(subject._exDates);
  });

  suite('#_ensureRules', function() {
    test('#_ruleDates', function() {
      var expected = [
        new Date(2012, 10, 5, 10),
        new Date(2012, 10, 10, 10)
      ];

      var dates = subject._ruleDates.map(function(time) {
        return time.toJSDate();
      });

      assert.deepEqual(expected, dates);
    });

    test('#_exDates', function() {
      var expected = [
        new Date(2012, 11, 4, 10),
        new Date(2013, 1, 5, 10),
        new Date(2013, 3, 2, 10)
      ];

      var dates = subject._exDates.map(function(time) {
        return time.toJSDate();
      });

      assert.deepEqual(expected, dates);
    });
  });

  suite('#_nextRecurrenceIter', function() {

    test('multiple rules', function() {
      var weekly = new ICAL.icalrecur.fromString(
        'FREQ=WEEKLY;BYDAY=TH'
      );

      var monthlyOn13th = new ICAL.icalrecur.fromString(
        'FREQ=MONTHLY;BYMONTHDAY=13'
      );

      subject._rules = [weekly, monthlyOn13th];


      var start = ICAL.icaltime.fromData({
        year: 2012,
        month: 2,
        day: 2
      });

      var expected = [
        new Date(2012, 1, 2),
        new Date(2012, 1, 9),
        new Date(2012, 1, 13),
        new Date(2012, 1, 16),
        new Date(2012, 1, 23)
      ];

      var inc = 0;
      var max = expected.length;
      var next = start;
      var dates = [];

      while (inc++ < max) {
        next = subject._nextRecurrenceIter(next);
        dates.push(next.last.toJSDate());
        next.next();
      }

      assert.deepEqual(dates, expected);
    });

  });

  suite('#next', function() {
    // I use JS dates widely because its much easier
    // to compare them via chai's deepEquals function
    var expected = [
      new Date(2012, 9, 2, 10),
      new Date(2012, 10, 5, 10),
      new Date(2012, 10, 6, 10),
      new Date(2012, 10, 10, 10),
      new Date(2013, 0, 1, 10)
    ];

    test('5 items', function() {
      var dates = [];
      var max = 5;
      var inc = 0;
      var next;

      while (inc++ < max && (next = subject.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(
        dates,
        expected
      );
    });

  });

});
