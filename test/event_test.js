suite('ICAL.Event', function() {


  let testTzid = 'America/New_York';
  testSupport.useTimezones(testTzid, 'America/Denver', 'America/Los_Angeles');

  let icsData;

  function rangeException(nth) {
    if (!nth || nth <= 0) {
      nth = 1;
    }

    let iter = subject.iterator();
    let last;

    while (nth--) {
      last = iter.next();
    }

    let newEvent = new ICAL.Event();

    newEvent.uid = subject.uid;

    newEvent.component
      .addPropertyWithValue(
        'recurrence-id',
        last
      ).setParameter(
        'range',
        ICAL.Event.THISANDFUTURE);

    return newEvent;
  }

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('recur_instances.ics');
  });

  let exceptions = [];
  let subject;
  let primaryItem;

  setup(function() {
    exceptions.length = 0;

    let root = new ICAL.Component(
      ICAL.parse(icsData)
    );

    let events = root.getAllSubcomponents('vevent');
    ICAL.TimezoneService.register(root.getFirstSubcomponent('vtimezone'));

    events.forEach(function(event) {
      if (!event.hasProperty('recurrence-id')) {
        primaryItem = event;
      } else {
        exceptions.push(event);
      }
    });

    subject = new ICAL.Event(primaryItem);
  });

  suite('changing timezones', function() {

    let dateFields = [
      ['startDate', 'dtstart'],
      ['endDate', 'dtend']
    ];

    function verifyTzidHandling(eventProp, icalProp) {

      let time;
      let property;
      setup(function() {
        property = subject.component.getFirstProperty(icalProp);

        assert.ok(
          property.getParameter('tzid'),
          'has tzid'
        );

        assert.isFalse(
          property.getParameter('tzid') === testTzid
        );
      });

      test('to floating time', function() {
        subject[eventProp] = time = new ICAL.Time({
          year: 2012,
          month: 1,
          day: 1,
          minute: 30,
          isDate: false
        });

        assert.ok(
          !property.getParameter('tzid'), 'removes tzid'
        );

        assert.include(
          property.toICALString(),
          time.toICALString()
        );
      });

      test('to utc time', function() {
        subject[eventProp] = time = new ICAL.Time({
          year: 2013,
          month: 1,
          day: 1,
          minute: 30,
          isDate: false,
          timezone: 'Z'
        });

        assert.ok(
          !property.getParameter('tzid'),
          'removes tzid'
        );

        assert.include(
          property.toICALString(),
          time.toICALString()
        );
      });

      test('to another timezone', function() {
        subject[eventProp] = time = new ICAL.Time({
          year: 2013,
          month: 1,
          day: 1,
          minute: 30,
          isDate: false,
          timezone: testTzid
        });

        assert.equal(
          property.getParameter('tzid'),
          testTzid
        );

        assert.include(
          property.toICALString(),
          time.toICALString()
        );
      });

      test('type date-time -> date', function() {
        // ensure we are in the right time type
        property.resetType('date-time');

        subject[eventProp] = time = new ICAL.Time({
          year: 2013,
          month: 1,
          day: 1,
          isDate: true
        });

        assert.equal(property.type, 'date');

        assert.include(
          property.toICALString(),
          time.toICALString()
        );
      });

      test('type date -> date-time', function() {
        // ensure we are in the right time type
        property.resetType('date');

        subject[eventProp] = time = new ICAL.Time({
          year: 2013,
          month: 1,
          day: 1,
          hour: 3,
          isDate: false
        });

        assert.equal(property.type, 'date-time');

        assert.include(
          property.toICALString(),
          time.toICALString()
        );
      });
    }

    dateFields.forEach(function(field) {
      suite(
        field[0],
        verifyTzidHandling.bind(this, field[0], field[1])
      );
    });

  });

  suite('initializer', function() {
    test('only with component', function() {
      assert.equal(subject.component, primaryItem);
      assert.instanceOf(subject.rangeExceptions, Array);
    });

    test('with exceptions from the component\'s parent if not specified in options', function() {
      subject = new ICAL.Event(primaryItem);

      let expected = Object.create(null);
      exceptions.forEach(function(exception) {
        expected[exception.getFirstPropertyValue('recurrence-id').toString()] = new ICAL.Event(exception);
      });

      assert.deepEqual(subject.exceptions, expected);
    });

    test('with exceptions specified in options if any', function() {
      subject = new ICAL.Event(primaryItem, {
        exceptions: exceptions.slice(1)
      });

      let expected = Object.create(null);
      exceptions.slice(1).forEach(function(exception) {
        expected[exception.getFirstPropertyValue('recurrence-id').toString()] = new ICAL.Event(exception);
      });

      assert.deepEqual(subject.exceptions, expected);
    });

    test('with strict exceptions', function() {
      subject = new ICAL.Event(primaryItem, {
        strictExceptions: true
      });
      assert.ok(subject.strictExceptions);
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
      let props;

      suiteSetup(function() {
        let props = {
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
        for (let key in props) {
          subject[key] = props[key];
          assert.equal(subject[key], props[key], key);
        }
      });

      test('to string roundtrip', function() {
        let aComp = new ICAL.Component(ICAL.parse(icsData));
        let aEvent = new ICAL.Event(aComp);

        let bComp = new ICAL.Component(
          ICAL.parse(aComp.toString())
        );

        let bEvent = new ICAL.Event(bComp);
        assert.equal(aEvent.toString(), bEvent.toString());
      });
    });

  });

  suite('#getOccurrenceDetails', function() {
    setup(function() {
      exceptions.forEach(subject.relateException, subject);
    });

    suite('RANGE=THISANDFUTURE', function() {
      test('starts earlier ends later', function() {
        let exception = rangeException(1);
        let rid = exception.recurrenceId;
        let time = rid.clone();

        exception.startDate = rid.clone();
        exception.endDate = rid.clone();

        // starts 2 hours & 2 min early
        exception.startDate.hour -= 2;
        exception.startDate.minute += 2;

        // starts 1 hour - 2 min later
        exception.endDate.hour += 1;
        exception.endDate.minute -= 2;

        subject.relateException(exception);


        // create a time that has no exception
        // but past the RID.
        let occurs = rid.clone();
        occurs.day += 3;
        occurs.hour = 13;
        occurs.minutes = 15;

        // Run the following tests twice, the second time around the results
        // will be cached.
        for (let i = 0; i < 2; i++) {
          let suffix = (i == 1 ? " (cached)" : "");
          let details = subject.getOccurrenceDetails(
            occurs
          );

          assert.ok(details, 'has details' + suffix);
          assert.equal(details.item, exception, 'uses exception' + suffix);


          let expectedStart = occurs.clone();
          let expectedEnd = occurs.clone();

          // same offset (in different day) as the difference
          // in the original exception.d
          expectedStart.hour -= 2;
          expectedStart.minute += 2;
          expectedEnd.hour += 1;
          expectedEnd.minute -= 2;

          assert.deepEqual(
            details.startDate.toJSDate(),
            expectedStart.toJSDate(),
            'start time offset' + suffix
          );

          assert.deepEqual(
            details.endDate.toJSDate(),
            expectedEnd.toJSDate(),
            'end time offset' + suffix
          );
        }
      });
    });

    test('exception', function() {
      let time = exceptions[0].getFirstPropertyValue('recurrence-id');

      let start = exceptions[0].getFirstPropertyValue('dtstart');
      let end = exceptions[0].getFirstPropertyValue('dtend');

      let result = subject.getOccurrenceDetails(time);

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

      let time = new ICAL.Time({
        year: 2012,
        month: 7,
        day: 12
      });

      let end = time.clone();
      end.addDuration(subject.duration);

      let result = subject.getOccurrenceDetails(time);

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

    test('iterate over exceptions', function() {
      for (let counter = 0, iterator = subject.iterator(); counter < 2; counter++) {
        let result = subject.getOccurrenceDetails(iterator.next());
        let exception = exceptions[counter];

        assert.equal(
          result.endDate.toString(),
          exception.getFirstPropertyValue('dtend').toString(),
          'end date'
        );

        assert.equal(
          result.startDate.toString(),
          exception.getFirstPropertyValue('dtstart').toString(),
          'start date'
        );

        assert.deepEqual(
          result.item.component.toJSON(),
          exception.toJSON(),
          'item'
        );
      }
    });
  });

  suite('#recurrenceTypes', function() {

    suite('multiple rrules', function() {
      let icsData;

      suiteSetup(async function() {
        icsData = await testSupport.loadSample('multiple_rrules.ics');
      });

      test('result', function() {
        let subject = new ICAL.Component(ICAL.parse(icsData));
        subject = new ICAL.Event(subject.getFirstSubcomponent('vevent'));

        let expected = {
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
      let exception = new ICAL.Event(exceptions[0]);

      assert.throws(function() {
        exception.relateException(exceptions[1]);
      });
    });

    test('trying to relate unrelated component (without strict)', function() {
      let exception = exceptions[0];
      let prop = exception.getFirstProperty('uid');
      prop.setValue('foo');

      subject.relateException(exception);
    });

    test('trying to relate unrelated component (with strict)', function() {
      let exception = exceptions[0];
      let prop = exception.getFirstProperty('uid');
      prop.setValue('foo');

      subject.strictExceptions = true;
      assert.throws(function() {
        subject.relateException(exception);
      }, /unrelated/);
    });

    test('from ical component', function() {
      subject = new ICAL.Event(primaryItem, { exceptions: [] });
      let exception = exceptions[0];
      subject.relateException(exception);

      let expected = Object.create(null);
      expected[exception.getFirstPropertyValue('recurrence-id').toString()] = new ICAL.Event(exception);

      assert.deepEqual(subject.exceptions, expected);
      assert.lengthOf(subject.rangeExceptions, 0, 'does not add range');
    });

    suite('with RANGE=THISANDFUTURE', function() {
      function exceptionTime(index, mod) {
        mod = mod || 0;


        let item = subject.rangeExceptions[index];
        let utc = item[0];
        let time = new ICAL.Time();
        time.fromUnixTime(utc + mod);

        return time;
      }

      let list;

      setup(function() {
        list = [
          rangeException(3),
          rangeException(10),
          rangeException(1)
        ];

        list.forEach(subject.relateException.bind(subject));
        assert.lengthOf(subject.rangeExceptions, 3);
      });

      function nthRangeException(nth) {
        return subject.rangeExceptions[nth];
      }

      function listDetails(obj) {
        return [
          obj.recurrenceId.toUnixTime(),
          obj.recurrenceId.toString()
        ];
      }

      test('ranges', function() {
        let expected = [
          listDetails(list[2]), // 1st
          listDetails(list[0]), // 2nd
          listDetails(list[1]) // 3rd
        ];

        assert.deepEqual(
          subject.rangeExceptions,
          expected
        );
      });

      test('#findRangeException', function() {
        let before = exceptionTime(0, -1);
        let on = exceptionTime(0);
        let first = exceptionTime(0, 1);
        let second = exceptionTime(1, 30);
        let third = exceptionTime(2, 100000);

        assert.ok(
          !subject.findRangeException(before),
          'find before range'
        );

        assert.ok(
          !subject.findRangeException(on),
          'day of exception does not need a modification'
        );

        assert.equal(
          subject.findRangeException(first),
          nthRangeException(0)[1],
          'finds first item'
        );

        assert.equal(
          subject.findRangeException(second),
          nthRangeException(1)[1],
          'finds second item'
        );

        assert.equal(
          subject.findRangeException(third),
          nthRangeException(2)[1],
          'finds third item'
        );
      });
    });
  });

  suite('#isRecurring', function() {
    test('when is primary recurring item', function() {
      assert.isTrue(subject.isRecurring());
    });

    test('when is exception', function() {
      let subject = new ICAL.Event(exceptions[0]);
      assert.isFalse(subject.isRecurring());
    });
  });

  suite('#modifiesFuture', function() {

    test('without range or exception', function() {
      assert.isFalse(subject.isRecurrenceException());
      assert.isFalse(subject.modifiesFuture());
    });

    test('with range and exception', function() {
      subject.component
        .addPropertyWithValue(
          'recurrence-id',
          ICAL.Time.fromJSDate(new Date()))
        .setParameter(
          'range',
          ICAL.Event.THISANDFUTURE);

      assert.isTrue(subject.modifiesFuture());
    });
  });

  suite('#isRecurrenceException', function() {
    test('when is primary recurring item', function() {
      assert.isFalse(subject.isRecurrenceException());
    });

    test('when is exception', function() {
      let subject = new ICAL.Event(exceptions[0]);
      assert.isTrue(subject.isRecurrenceException());
    });
  });

  suite('date props', function() {
    [
      ['dtstart', 'startDate'],
      ['dtend', 'endDate']
    ].forEach(function(dateType) {
      let ical = dateType[0];
      let prop = dateType[1];
      let timeProp;
      let changeTime;

      suite('#' + prop, function() {
        let tzid = 'America/Denver';

        setup(function() {
          timeProp = primaryItem.getFirstProperty(ical);
        });

        test('get', function() {
          let expected = timeProp.getFirstValue(ical);
          assert.deepEqual(expected, subject[prop]);
        });

        function changesTzid(newTzid) {
          assert.notEqual(
            timeProp.getFirstValue().zone.tzid,
            changeTime.zone.tzid,
            'zones are different'
          );

          subject[prop] = changeTime;
          assert.equal(
            newTzid,
            timeProp.getParameter('tzid'),
            'removes timezone id'
          );
        }

        test('changing timezone from America/Los_Angeles', function() {
          changeTime = new ICAL.Time({
            year: 2012,
            month: 1,
            timezone: tzid
          });

          changesTzid(tzid);
        });

        test('changing timezone from floating to UTC', function() {
          timeProp.setValue(new ICAL.Time({
            year: 2012,
            month: 1
          }));

          changeTime = new ICAL.Time({
            year: 2012,
            month: 1,
            timezone: 'Z'
          });

          changesTzid(undefined);
        });

        test('changing timezone to floating', function() {
          timeProp.setValue(new ICAL.Time({
            year: 2012,
            month: 1,
            timezone: 'Z'
          }));

          changeTime = new ICAL.Time({
            year: 2012,
            month: 1
          });

          changesTzid(undefined);
        });

      });

    });
  });

  suite('remaining properties', function() {
    function testProperty(prop, changeval) {
      test('#' + prop, function() {
        let expected = primaryItem.getFirstPropertyValue(prop);
        assert.deepEqual(subject[prop], expected);

        subject[prop] = changeval;
        assert.equal(primaryItem.getFirstPropertyValue(prop), changeval);
      });
    }

    testProperty('location', 'other');
    testProperty('summary', 'other');
    testProperty('description', 'other');
    testProperty('organizer', 'other');
    testProperty('uid', 'other');
    testProperty('sequence', 123);
    testProperty('color', 'turquoise');

    test('#duration', function() {
      let end = subject.endDate;
      let start = subject.startDate;
      let duration = end.subtractDate(start);

      assert.deepEqual(
        subject.duration.toString(),
        duration.toString()
      );
    });

    test('#attendees', function() {
      let props = primaryItem.getAllProperties('attendee');
      assert.deepEqual(subject.attendees, props);
    });

    test('#recurrenceId', function() {
      let subject = new ICAL.Event(exceptions[0]);
      let expected = exceptions[0].getFirstPropertyValue('recurrence-id');
      let changeval = exceptions[1].getFirstPropertyValue('recurrence-id');
      assert.deepEqual(subject.recurrenceId, expected);

      subject.recurrenceId = changeval;
      assert.deepEqual(subject.component.getFirstPropertyValue('recurrence-id'), changeval);

      let tzid = 'America/New_York';
      let changeval2 = new ICAL.Time({
        year: 2012,
        month: 1,
        day: 1,
        hour: 12,
        minute: 13,
        second: 14,
        timezone: tzid
      });

      subject.recurrenceId = changeval2;
      assert.deepEqual(subject.component.getFirstProperty('recurrence-id').getParameter("tzid"), tzid);
    });
  });

  suite('#iterator', function() {
    test('with start time', function() {
      let start = subject.startDate;
      let time = new ICAL.Time({
        day: start.da + 1,
        month: start.month,
        year: start.year
      });

      let iterator = subject.iterator(time);
      assert.deepEqual(iterator.last.toString(), time.toString());
      assert.instanceOf(iterator, ICAL.RecurExpansion);
    });

    test('without a start time', function() {
      let iterator = subject.iterator();

      assert.equal(
        iterator.last.toString(),
        subject.startDate.toString()
      );
    });
  });

  suite('duration instead of dtend', function() {
    let icsData;

    suiteSetup(async function() {
      icsData = await testSupport.loadSample('duration_instead_of_dtend.ics');
    });

    test('result', function() {
      let subject = new ICAL.Component(ICAL.parse(icsData));
      subject = new ICAL.Event(subject.getFirstSubcomponent('vevent'));
      assert.equal(subject.startDate.toString(), new ICAL.Time({
          year: 2012,
          month: 6,
          day: 30,
          hour: 6,
          isDate: false,
          timezone: testTzid
      }).toString());

      assert.equal(subject.endDate.toString(), new ICAL.Time({
          year: 2012,
          month: 7,
          day: 1,
          hour: 6,
          isDate: false,
          timezone: testTzid
      }).toString());

      assert.equal(subject.duration.toString(), 'P1D');
    });

    test('set', function() {
      let subject = new ICAL.Component(ICAL.parse(icsData));
      subject = new ICAL.Event(subject.getFirstSubcomponent('vevent'));

      assert.include(subject.toString(), "DURATION");
      assert.notInclude(subject.toString(), "DTEND");

      subject.endDate = new ICAL.Time({
          year: 2012,
          month: 7,
          day: 2,
          hour: 6,
          isDate: false,
          timezone: subject.startDate.zone
      });

      assert.equal(subject.duration.toString(), 'P2D');
      assert.equal(subject.endDate.toString(), new ICAL.Time({
          year: 2012,
          month: 7,
          day: 2,
          hour: 6,
          isDate: false,
          timezone: testTzid
      }).toString());

      assert.notInclude(subject.toString(), "DURATION");
      assert.include(subject.toString(), "DTEND");
    });
  });

  suite('only a dtstart date', function() {
    let icsData;

    suiteSetup(async function() {
      icsData = await testSupport.loadSample('only_dtstart_date.ics');
    });

    test('result', function() {
      let subject = new ICAL.Component(ICAL.parse(icsData));
      subject = new ICAL.Event(subject.getFirstSubcomponent('vevent'));
      assert.equal(subject.startDate.toString(), new ICAL.Time({
          year: 2012,
          month: 6,
          day: 30,
          hour: 0,
          isDate: true,
          timezone: testTzid
      }).toString());

      assert.equal(subject.endDate.toString(), new ICAL.Time({
          year: 2012,
          month: 7,
          day: 1,
          hour: 6,
          isDate: true,
          timezone: testTzid
      }).toString());

      assert.equal(subject.duration.toString(), 'P1D');
    });
  });

  suite('only a dtstart time', function() {
    let icsData;

    suiteSetup(async function() {
      icsData = await testSupport.loadSample('only_dtstart_time.ics');
    });

    test('result', function() {
      let subject = new ICAL.Component(ICAL.parse(icsData));
      subject = new ICAL.Event(subject.getFirstSubcomponent('vevent'));
      assert.equal(subject.startDate.toString(), new ICAL.Time({
          year: 2012,
          month: 6,
          day: 30,
          hour: 6,
          isDate: false,
          timezone: testTzid
      }).toString());

      assert.equal(subject.endDate.toString(), new ICAL.Time({
          year: 2012,
          month: 6,
          day: 30,
          hour: 6,
          isDate: false,
          timezone: testTzid
      }).toString());

      assert.equal(subject.duration.toString(), 'PT0S');
    });
  });

  suite('dtend instead of duration', function() {
    let icsData;

    suiteSetup(async function() {
      icsData = await testSupport.loadSample('minimal.ics');
    });

    test('result with different timezones', function() {
      let subject = (new ICAL.Component(ICAL.parse(icsData)))
        .getFirstSubcomponent('vevent');
      // 3 hours ahead of L.A.
      subject.updatePropertyWithValue('dtstart', ICAL.Time.fromData({
        year: 2012,
        month: 1,
        day: 1,
        hour: 10,
        minute: 20,
        timezone: 'America/New_York'
      }));
      subject.updatePropertyWithValue('dtend', ICAL.Time.fromData({
        year: 2012,
        month: 1,
        day: 1,
        hour: 12,
        minute: 50,
        timezone: 'America/Los_Angeles'
      }));

      subject = new ICAL.Event(subject);
      assert.equal(subject.startDate.toString(), ICAL.Time.fromData({
        year: 2012,
        month: 1,
        day: 1,
        hour: 10,
        minute: 20,
        timezone: 'America/New_York',
      }).toString());

      assert.equal(subject.endDate.toString(), ICAL.Time.fromData({
        year: 2012,
        month: 1,
        day: 1,
        hour: 12,
        minute: 50,
        timezone: 'America/Los_Angeles'
      }).toString());

      assert.equal(subject.duration.toString(), 'PT5H30M');
    });

    test('set', function() {
      let subject = new ICAL.Component(ICAL.parse(icsData));
      subject = new ICAL.Event(subject.getFirstSubcomponent('vevent'));

      assert.notInclude(subject.toString(), "DURATION");
      assert.include(subject.toString(), "DTEND");

      subject.duration = ICAL.Duration.fromString("P2D");

      assert.equal(subject.duration.toString(), 'P2D');
      assert.equal(subject.endDate.toString(), new ICAL.Time({
          year: 2012,
          month: 7,
          day: 2,
          hour: 6,
          isDate: false,
          timezone: testTzid
      }).toString());

      assert.include(subject.toString(), "DURATION");
      assert.notInclude(subject.toString(), "DTEND");
    });
  });
});
