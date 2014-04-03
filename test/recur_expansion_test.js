suite('recur_expansion', function() {
  var component;
  var subject;
  var icsData = {};
  var primary;

  function createSubject(file) {

    testSupport.defineSample(file, function(data) {
      icsData[file] = data;
    });

    setup(function(done) {
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
        subject = new ICAL.RecurExpansion({
          component: primary.component,
          dtstart: primary.startDate
        });

        done();
      }

      parse.process(icsData[file]);
    });
  }

  createSubject('recur_instances.ics');

  test('initialization', function() {
    assert.deepEqual(
      new Date(2012, 9, 2, 10),
      subject.last.toJSDate()
    );

    assert.instanceOf(subject.ruleIterators, Array);
    assert.ok(subject.exDates);
  });

  suite('#_ensureRules', function() {
    test('.ruleDates', function() {
      var expected = [
        new Date(2012, 10, 5, 10),
        new Date(2012, 10, 10, 10),
        new Date(2012, 10, 30, 10)
      ];


      var dates = subject.ruleDates.map(function(time) {
        return time.toJSDate();
      });

      assert.deepEqual(expected, dates);
    });

    test('.exDates', function() {
      var expected = [
        new Date(2012, 11, 4, 10),
        new Date(2013, 1, 5, 10),
        new Date(2013, 3, 2, 10)
      ];

      var dates = subject.exDates.map(function(time) {
        return time.toJSDate();
      });

      assert.deepEqual(expected, dates);
    });
  });

  suite('#_nextRecurrenceIter', function() {
    var component;

    setup(function() {
      // setup a clean component with no rules
      component = primary.component.toJSON();
      component = new ICAL.Component(component);

      // Simulate a more complicated event by using
      // the original as a base and adding more complex rrule's
      component.removeProperty('rrule');
    });

    test('when rule ends', function() {
      var start = {
        year: 2012,
        month: 1,
        day: 1
      };

      component.removeAllProperties('rdate');
      component.removeAllProperties('exdate');
      component.addPropertyWithValue('rrule', { freq: "WEEKLY", count: 3, byday: ["SU"] });

      var subject = new ICAL.RecurExpansion({
        component: component,
        dtstart: start
      });

      var expected = [
        new Date(2012, 0, 1),
        new Date(2012, 0, 8),
        new Date(2012, 0, 15)
      ];

      var max = 10;
      var i = 0;
      var next;
      var dates = [];

      while (i++ <= max && (next = subject.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(dates, expected);
    });

    test('multiple rules', function() {
      component.addPropertyWithValue('rrule', { freq: "MONTHLY", bymonthday: [13] });
      component.addPropertyWithValue('rrule', { freq: "WEEKLY", byday: ["TH"] });

      var start = ICAL.Time.fromData({
        year: 2012,
        month: 2,
        day: 2
      });

      var subject = new ICAL.RecurExpansion({
        component: component,
        dtstart: start
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
      var next;
      var dates = [];

      while (inc++ < max) {
        next = subject._nextRecurrenceIter();
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
      new Date(2012, 10, 30, 10),
      new Date(2013, 0, 1, 10)
    ];

    test('6 items', function() {
      var dates = [];
      var max = 6;
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

  suite('#next - finite', function() {
    createSubject('recur_instances_finite.ics');

    test('until complete', function() {
      var max = 100;
      var inc = 0;
      var next;

      var dates = [];
      var expected = [
        new Date(2012, 9, 2, 10),
        new Date(2012, 10, 5, 10),
        new Date(2012, 10, 6, 10),
        new Date(2012, 10, 10, 10),
        new Date(2012, 11, 4, 10)
      ];

      while (inc++ < max && (next = subject.next())) {
        dates.push(next.toJSDate());
      }

      // round trip
      subject = new ICAL.RecurExpansion(subject.toJSON());

      while (inc++ < max && (next = subject.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(dates, expected);
      assert.isTrue(subject.complete, 'complete');
    });
  });


  suite('#toJSON', function() {
    test('from start', function() {
      var json = subject.toJSON();
      var newIter = new ICAL.RecurExpansion(json);
      var cur = 0;

      while (cur++ < 10) {
        assert.deepEqual(
          subject.next().toJSDate(),
          newIter.next().toJSDate(),
          'failed compare at #' + cur
        );
      }
    });

    test('from two iterations', function() {
      subject.next();
      subject.next();

      var json = subject.toJSON();
      var newIter = new ICAL.RecurExpansion(json);
      var cur = 0;

      while (cur++ < 10) {
        assert.deepEqual(
          subject.next().toJSDate(),
          newIter.next().toJSDate(),
          'failed compare at #' + cur
        );
      }
    });

  });

  suite('event without recurrences', function() {
    createSubject('minimal.ics');

    test('iterate', function() {
      var dates = [];
      var next;

      var expected = primary.startDate.toJSDate();

      while ((next = subject.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(dates[0], expected);
      assert.length(dates, 1);
      assert.isTrue(subject.complete);

      // json check
      subject = new ICAL.RecurExpansion(
        subject.toJSON()
      );

      assert.isTrue(subject.complete, 'complete after json');
      assert.ok(!subject.next(), 'next value');
    });

  });

});
