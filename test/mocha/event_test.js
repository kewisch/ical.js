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

    var root = new ICAL.icalcomponent(ICAL.parse(icsData));
    var events = root.components.VEVENT;

    events.forEach(function(event) {
      if (!event.hasProperty('RECURRENCE-ID')) {
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
        var id = item.getFirstPropertyValue('RECURRENCE-ID').toString();
        assert.ok(subject.exceptions[id], 'has: ' + id + ' exception');
        assert.deepEqual(
          subject.exceptions[id].component.toJSON(),
          item.toJSON()
        );
      });
    });
  });

  suite('#getOccurrenceDetails', function() {
    setup(function() {
      exceptions.forEach(subject.relateException, subject);
    });

    test('exception', function() {
      var time = exceptions[0].getFirstPropertyValue('RECURRENCE-ID');

      var start = exceptions[0].getFirstPropertyValue('DTSTART');
      var end = exceptions[0].getFirstPropertyValue('DTEND');

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

      var time = new ICAL.icaltime({
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
        var subject = new ICAL.icalcomponent(ICAL.parse(icsData));
        subject = new ICAL.Event(subject.getFirstSubcomponent('VEVENT'));

        var expected = {
          'MONTHLY': true,
          'WEEKLY': true
        };

        assert.deepEqual(subject.getRecurrenceTypes(), expected);
      });
    });

    test('no rrule', function() {
      subject.component.removeProperty('RRULE');

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

    test('trying to relate unrelated component', function() {
      var exception = exceptions[0];
      var prop = exception.getFirstProperty('UID');
      prop.setValue('foo', 'TEXT');

      assert.throws(function() {
        subject.relateException(exception);
      }, /unrelated/);
    });

    test('from ical component', function() {
      var exception = exceptions[0];
      subject.relateException(exception);

      var expected = Object.create(null);
      expected[exception.getFirstPropertyValue('RECURRENCE-ID').toString()] =
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
    var expected = primaryItem.getFirstPropertyValue('UID');
    expected = expected.data.value[0];
    assert.equal(expected, subject.uid);
  });

  test('#organizer', function() {
    var expected = primaryItem.getFirstPropertyValue('ORGANIZER');
    assert.deepEqual(expected, subject.organizer);
  });

  test('#startDate', function() {
    var expected = primaryItem.getFirstPropertyValue('DTSTART');
    assert.deepEqual(expected, subject.startDate);
  });

  test('#endDate', function() {
    var expected = primaryItem.getFirstPropertyValue('DTEND');
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

  test('#location', function() {
    var expected = primaryItem.getFirstPropertyValue('LOCATION');
    expected = expected.data.value[0];
    assert.deepEqual(expected, subject.location);
  });

  test('#attendees', function() {
    var props = primaryItem.getAllProperties('ATTENDEE');
    assert.deepEqual(subject.attendees, props);
  });

  test('#summary', function() {
    var expected = primaryItem.getFirstPropertyValue('SUMMARY');
    expected = expected.data.value[0];
    assert.deepEqual(subject.summary, expected);
  });

  test('#description', function() {
    var expected = primaryItem.getFirstPropertyValue('DESCRIPTION');
    expected = expected.data.value[0];
    assert.deepEqual(subject.description, expected);
  });

  test('#recurrenceId', function() {
    var subject = new ICAL.Event(exceptions[0]);
    var expected = exceptions[0].getFirstPropertyValue('RECURRENCE-ID');
    assert.deepEqual(subject.recurrenceId, expected);
  });

  suite('#iterator', function() {
    test('with start time', function() {
      var start = subject.startDate;
      var time = new ICAL.icaltime({
        day: start.da + 1,
        month: start.month,
        year: start.year
      });

      var iterator = subject.iterator(time);
      assert.deepEqual(iterator.currentTime.toString(), time.toString());
      assert.equal(iterator.component, subject.component);
    });


    test('without a start time', function() {
      var iterator = subject.iterator();

      assert.equal(
        iterator.currentTime.toString(),
        subject.startDate.toString()
      );
    });
  });

});
