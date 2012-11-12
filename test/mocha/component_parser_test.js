suite('component_parser', function() {
  var subject;
  var icsData;

  testSupport.defineSample('recur_instances.ics', function(data) {
    icsData = data;
  });

  suite('#process', function() {
    var events = [];

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

        subject = new ICAL.ComponentParser(options);

        subject.onrecurrenceexception = function(item) {
          exceptions.push(item);
        };

        subject.onevent = function(event) {
          events.push(event);
        }

        subject.oncomplete = function() {
          done();
        }

        subject.process(icsData);
      });
    }

    suite('without events', function() {
      setupProcess({ parseEvent: false });

      test('parse result', function() {
        assert.length(events, 0);
      });
    });

    suite('with events', function() {
      setupProcess();

      test('parse result', function() {
        var component = new ICAL.Componentv2(ICAL.parse(icsData)[1]);
        var list = component.getAllSubcomponents('vevent');

        var expectedEvents = [];

        list.forEach(function(item) {
          expectedEvents.push(new ICAL.Event(item));
        });

        assert.instanceOf(expectedEvents[0], ICAL.Event);

        eventEquals(events[0], expectedEvents[0]);
        eventEquals(events[1], expectedEvents[1]);
        eventEquals(events[2], expectedEvents[2]);
      });
    });
  });

});
