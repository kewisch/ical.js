suite('ICAL.Event', function() {

  var icsData;

  testSupport.defineSample('recur_instances.ics', function(data) {
    icsData = data;
  });

  var exceptions = [];
  var subject;
  var primaryItem;

  setup(function() {
    exceptions.length = 0;

    var root = new ICAL.Component(
      ICAL.parse(icsData)[1]
    );

    var events = root.getAllSubcomponents('vevent');

    events.forEach(function(event) {
      if (!event.hasProperty('recurrence-id')) {
        primaryItem = event;
      } else {
        exceptions.push(event);
      }
    });

    subject = new ICAL.Event(primaryItem);
  });

  suite('initializer', function() {
    test('only with component', function() {
      assert.equal(subject.component, primaryItem);
    });

    test('with exceptions', function() {
      subject = new ICAL.Event(primaryItem, {
        exceptions: exceptions
      });

      exceptions.forEach(function(item) {
        var id = item.getFirstPropertyValue('recurrence-id').toString();
        assert.ok(subject.exceptions[id], 'has: ' + id + ' exception');
        assert.deepEqual(
          subject.exceptions[id].component.toJSON(),
          item.toJSON()
        );
      });
    });
  });

  suite('creating a event', function() {
    setup(function() {
      subject = new ICAL.Event();
    });

    test('initial state', function() {
      assert.instanceOf(subject.component, ICAL.Component);
      assert.equal(subject.component.name, 'vevent');
    });

    suite('roundtrip', function() {
      var props;

      suiteSetup(function() {
        var props = {
          uid: 'zfoo',
          summary: 'sum',
          description: 'desc',
          startDate: new ICAL.Time({
            year: 2012,
            month: 1,
            day: 1,
            hour: 5
          }),
          endDate: new ICAL.Time({
            year: 2012,
            month: 1,
            day: 1,
            hour: 10
          }),
          location: 'place',
          organizer: 'SJL',
          recurrenceId: new ICAL.Time({
            year: 2012,
            month: 1,
            day: 1
          })
        };
      });

      test('setters', function() {
        for (key in props) {
          subject[key] = props[key];
          assert.equal(subject[key], props[key], key);
        }
      });

      test('to string roundtrip', function() {
        var aComp = new ICAL.Component(ICAL.parse(icsData)[1]);
        var aEvent = new ICAL.Event(aComp);

        var bComp = new ICAL.Component(
          ICAL.parse(aComp.toString())[1]
        );

        var bEvent = new ICAL.Event(bComp);
        assert.equal(aEvent.toString(), bEvent.toString());
      });
    });

  });

  suite('#getOccurrenceDetails', function() {
    setup(function() {
      exceptions.forEach(subject.relateException, subject);
    });

    test('exception', function() {
      var time = exceptions[0].getFirstPropertyValue('recurrence-id');

      var start = exceptions[0].getFirstPropertyValue('dtstart');
      var end = exceptions[0].getFirstPropertyValue('dtend');

      var result = subject.getOccurrenceDetails(time);

      assert.equal(
        result.recurrenceId.toString(),
        time.toString(),
        'recurrence id'
      );

      assert.equal(
        result.endDate.toString(),
        end.toString(),
        'end date'
      );

      assert.equal(
        result.startDate.toString(),
        start.toString(),
        'start date'
      );

      assert.deepEqual(
        result.item.component.toJSON(),
        exceptions[0].toJSON(),
        'item'
      );
    });

    test('non-exception', function() {

      var time = new ICAL.Time({
        year: 2012,
        month: 7,
        day: 12
      });

      var end = time.clone();
      end.addDuration(subject.duration);

      var result = subject.getOccurrenceDetails(time);

      assert.equal(
        result.startDate.toString(),
        time.toString(),
        'start date'
      );

      assert.equal(
        result.endDate.toString(),
        end.toString()
      );

      assert.equal(
        result.recurrenceId.toString(),
        time.toString()
      );

      assert.equal(result.item, subject);
    });
  });

  suite('#recurrenceTypes', function() {

    suite('multiple rrules', function() {
      var icsData;

      testSupport.defineSample('multiple_rrules.ics', function(data) {
        icsData = data;
      });

      test('result', function() {
        var subject = new ICAL.Component(ICAL.parse(icsData)[1]);
        subject = new ICAL.Event(subject.getFirstSubcomponent('vevent'));

        var expected = {
          'MONTHLY': true,
          'WEEKLY': true
        };

        assert.deepEqual(subject.getRecurrenceTypes(), expected);
      });
    });

    test('no rrule', function() {
      subject.component.removeProperty('rrule');

      assert.deepEqual(
        subject.getRecurrenceTypes(),
        {}
      );
    });
  });

  suite('#relateException', function() {

    test('trying to relate an exception to an exception', function() {
      var exception = new ICAL.Event(exceptions[0]);

      assert.throws(function() {
        exception.relateException(exceptions[1]);
      });
    });

    test('trying to relate unrelated component (without strict)', function() {
      var exception = exceptions[0];
      var prop = exception.getFirstProperty('uid');
      prop.setValue('foo');

      subject.relateException(exception);
    });

    test('trying to relate unrelated component (with strict)', function() {
      var exception = exceptions[0];
      var prop = exception.getFirstProperty('uid');
      prop.setValue('foo');

      subject.strictExceptions = true;
      assert.throws(function() {
        subject.relateException(exception);
      }, /unrelated/);
    });

    test('from ical component', function() {
      var exception = exceptions[0];
      subject.relateException(exception);

      var expected = Object.create(null);
      expected[exception.getFirstPropertyValue('recurrence-id').toString()] =
        new ICAL.Event(exception);

      assert.deepEqual(subject.exceptions, expected);
    });
  });

  suite('#isRecurring', function() {
    test('when is primary recurring item', function() {
      assert.isTrue(subject.isRecurring());
    });

    test('when is exception', function() {
      var subject = new ICAL.Event(exceptions[0]);
      assert.isFalse(subject.isRecurring());
    });
  });

  suite('#isRecurrenceException', function() {
    test('when is primary recurring item', function() {
      assert.isFalse(subject.isRecurrenceException());
    });

    test('when is exception', function() {
      var subject = new ICAL.Event(exceptions[0]);
      assert.isTrue(subject.isRecurrenceException());
    });
  });

  test('#uid', function() {
    var expected = primaryItem.getFirstPropertyValue('uid');
    expected = expected;
    assert.equal(expected, subject.uid);
  });

  test('#organizer', function() {
    var expected = primaryItem.getFirstPropertyValue('organizer');
    assert.deepEqual(expected, subject.organizer);
  });

  test('#startDate', function() {
    var expected = primaryItem.getFirstPropertyValue('dtstart');
    assert.deepEqual(expected, subject.startDate);
  });

  test('#endDate', function() {
    var expected = primaryItem.getFirstPropertyValue('dtend');
    assert.deepEqual(expected, subject.endDate);
  });

  test('#duration', function() {
    var end = subject.endDate;
    var start = subject.startDate;
    var duration = end.subtractDate(start);

    assert.deepEqual(
      subject.duration.toString(),
      duration.toString()
    );
  });

  test('#sequence', function() {
    var expected = primaryItem.getFirstPropertyValue('sequence');
    expected = expected;

    assert.deepEqual(subject.sequence, expected);
  });

  test('#location', function() {
    var expected = primaryItem.getFirstPropertyValue('location');
    expected = expected;
    assert.deepEqual(expected, subject.location);
  });

  test('#attendees', function() {
    var props = primaryItem.getAllProperties('attendee');
    assert.deepEqual(subject.attendees, props);
  });

  test('#summary', function() {
    var expected = primaryItem.getFirstPropertyValue('summary');
    expected = expected;
    assert.deepEqual(subject.summary, expected);
  });

  test('#description', function() {
    var expected = primaryItem.getFirstPropertyValue('description');
    expected = expected;
    assert.deepEqual(subject.description, expected);
  });

  test('#recurrenceId', function() {
    var subject = new ICAL.Event(exceptions[0]);
    var expected = exceptions[0].getFirstPropertyValue('recurrence-id');
    assert.deepEqual(subject.recurrenceId, expected);
  });

  suite('#iterator', function() {
    test('with start time', function() {
      var start = subject.startDate;
      var time = new ICAL.Time({
        day: start.da + 1,
        month: start.month,
        year: start.year
      });

      var iterator = subject.iterator(time);
      assert.deepEqual(iterator.last.toString(), time.toString());
      assert.instanceOf(iterator, ICAL.RecurExpansion);
    });

    test('without a start time', function() {
      var iterator = subject.iterator();

      assert.equal(
        iterator.last.toString(),
        subject.startDate.toString()
      );
    });
  });

});
