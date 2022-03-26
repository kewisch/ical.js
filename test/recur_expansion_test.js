suite('recur_expansion', function() {
  let subject, primary;

  function createSubject(file) {
    setup(async function() {
      let icsData = await testSupport.loadSample(file);
      let exceptions = [];

      await new Promise((resolve) => {
        let parse = new ICAL.ComponentParser();

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

          resolve();
        };
        parse.process(icsData);
      });

    });
  }

  createSubject('recur_instances.ics');

  suite('initialization', function() {
    test('successful', function() {
      assert.deepEqual(
        new Date(2012, 9, 2, 10),
        subject.last.toJSDate()
      );

      assert.instanceOf(subject.ruleIterators, Array);
      assert.ok(subject.exDates);
    });

    test('invalid', function() {
      assert.throws(() => new ICAL.RecurExpansion({}), ".dtstart (ICAL.Time) must be given");
      assert.throws(() => {
        return new ICAL.RecurExpansion({
          dtstart: ICAL.Time.now()
        });
      }, ".ruleIterators or .component must be given");
    });

    test('default', function() {
      let dtstart = ICAL.Time.fromData({
        year: 2012,
        month: 2,
        day: 2
      });
      let expansion = new ICAL.RecurExpansion({
        dtstart: dtstart,
        ruleIterators: []
      });

      assert.lengthOf(expansion.ruleDates, 0);
      assert.lengthOf(expansion.exDates, 0);
      assert.isFalse(expansion.complete);

      assert.deepEqual(expansion.toJSON(), {
        ruleIterators: [],
        ruleDates: [],
        exDates: [],
        ruleDateInc: undefined,
        exDateInc: undefined,
        dtstart: dtstart.toJSON(),
        last: dtstart.toJSON(),
        complete: false
      });
    });
  });

  suite('#_ensureRules', function() {
    test('.ruleDates', function() {
      let expected = [
        new Date(2012, 10, 5, 10),
        new Date(2012, 10, 10, 10),
        new Date(2012, 10, 30, 10)
      ];


      let dates = subject.ruleDates.map(function(time) {
        return time.toJSDate();
      });

      assert.deepEqual(expected, dates);
    });

    test('.exDates', function() {
      let expected = [
        new Date(2012, 11, 4, 10),
        new Date(2013, 1, 5, 10),
        new Date(2013, 3, 2, 10)
      ];

      let dates = subject.exDates.map(function(time) {
        return time.toJSDate();
      });

      assert.deepEqual(expected, dates);
    });
  });

  suite('#_nextRecurrenceIter', function() {
    let component;

    setup(function() {
      // setup a clean component with no rules
      component = primary.component.toJSON();
      component = new ICAL.Component(component);

      // Simulate a more complicated event by using
      // the original as a base and adding more complex rrule's
      component.removeProperty('rrule');
    });

    test('when rule ends', function() {
      let start = {
        year: 2012,
        month: 1,
        day: 1
      };

      component.removeAllProperties('rdate');
      component.removeAllProperties('exdate');
      component.addPropertyWithValue('rrule', { freq: "WEEKLY", count: 3, byday: ["SU"] });

      let expansion = new ICAL.RecurExpansion({
        component: component,
        dtstart: start
      });

      let expected = [
        new Date(2012, 0, 1),
        new Date(2012, 0, 8),
        new Date(2012, 0, 15)
      ];

      let max = 10;
      let i = 0;
      let next;
      let dates = [];

      while (i++ <= max && (next = expansion.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(dates, expected);
    });

    test('multiple rules', function() {
      component.addPropertyWithValue('rrule', { freq: "MONTHLY", bymonthday: [13] });
      component.addPropertyWithValue('rrule', { freq: "WEEKLY", byday: ["TH"] });

      let start = ICAL.Time.fromData({
        year: 2012,
        month: 2,
        day: 2
      });

      let expansion = new ICAL.RecurExpansion({
        component: component,
        dtstart: start
      });

      let expected = [
        new Date(2012, 1, 2),
        new Date(2012, 1, 9),
        new Date(2012, 1, 13),
        new Date(2012, 1, 16),
        new Date(2012, 1, 23)
      ];

      let inc = 0;
      let max = expected.length;
      let next;
      let dates = [];

      while (inc++ < max) {
        next = expansion._nextRecurrenceIter();
        dates.push(next.last.toJSDate());
        next.next();
      }

      assert.deepEqual(dates, expected);
    });

  });

  suite('#next', function() {
    // I use JS dates widely because its much easier
    // to compare them via chai's deepEquals function
    let expected = [
      new Date(2012, 9, 2, 10),
      new Date(2012, 10, 5, 10),
      new Date(2012, 10, 6, 10),
      new Date(2012, 10, 10, 10),
      new Date(2012, 10, 30, 10),
      new Date(2013, 0, 1, 10)
    ];

    test('6 items', function() {
      let dates = [];
      let max = 6;
      let inc = 0;
      let next;

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
      let max = 100;
      let inc = 0;
      let next;

      let dates = [];
      let expected = [
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
      let json = subject.toJSON();
      let newIter = new ICAL.RecurExpansion(json);
      let cur = 0;

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

      let json = subject.toJSON();
      let newIter = new ICAL.RecurExpansion(json);
      let cur = 0;

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
      let dates = [];
      let next;

      let expected = primary.startDate.toJSDate();

      while ((next = subject.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(dates[0], expected);
      assert.lengthOf(dates, 1);
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
