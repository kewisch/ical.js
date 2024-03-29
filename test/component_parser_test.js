suite('component_parser', function() {
  let subject;
  let icsData;

  suiteSetup(async function() {
    icsData = await testSupport.loadSample('recur_instances.ics');
  });

  suite('#process', function() {
    let events = [];
    let exceptions = [];
    let timezones = [];

    function eventEquals(a, b, msg) {
      if (!a)
        throw new Error('actual is falsy');

      if (!b)
        throw new Error('expected is falsy');

      if (a instanceof ICAL.Event) {
        a = a.component;
      }

      if (b instanceof ICAL.Event) {
        b = b.component;
      }

      assert.deepEqual(a.toJSON(), b.toJSON(), msg);
    }

    function setupProcess(options) {
      setup(function(done) {
        events.length = 0;
        timezones.length = 0;

        subject = new ICAL.ComponentParser(options);

        subject.onrecurrenceexception = function(item) {
          exceptions.push(item);
        };

        subject.onevent = function(event) {
          events.push(event);
        };

        subject.ontimezone = function(tz) {
          timezones.push(tz);
        };

        subject.oncomplete = function() {
          done();
        };

        subject.process(ICAL.parse(icsData));
      });
    }

    suite('without events', function() {
      setupProcess({ parseEvent: false });

      test('parse result', function() {
        assert.lengthOf(events, 0);
        assert.lengthOf(timezones, 1);

        let tz = timezones[0];
        assert.instanceOf(tz, ICAL.Timezone);
        assert.equal(tz.tzid, 'America/Los_Angeles');
      });

    });

    suite('with events', function() {
      setupProcess();

      test('parse result', function() {
        let component = new ICAL.Component(ICAL.parse(icsData));
        let list = component.getAllSubcomponents('vevent');

        let expectedEvents = [];

        list.forEach(function(item) {
          expectedEvents.push(new ICAL.Event(item));
        });

        assert.instanceOf(expectedEvents[0], ICAL.Event);

        eventEquals(events[0], expectedEvents[0]);
        eventEquals(events[1], expectedEvents[1]);
        eventEquals(events[2], expectedEvents[2]);
      });
    });

    suite('without parsing timezones', function() {
      setupProcess({ parseTimezone: false });

      test('parse result', function() {
        assert.lengthOf(timezones, 0);
        assert.lengthOf(events, 3);
      });
    });

    suite('alternate input', function() {
      test('parsing component from string', function(done) {
        subject = new ICAL.ComponentParser();
        subject.oncomplete = function() {
          assert.lengthOf(events, 3);
          done();
        };
        subject.process(icsData);
      });
      test('parsing component from component', function(done) {
        subject = new ICAL.ComponentParser();
        subject.oncomplete = function() {
          assert.lengthOf(events, 3);
          done();
        };
        let comp = new ICAL.Component(ICAL.parse(icsData));
        subject.process(comp);
      });
    });
  });

});
