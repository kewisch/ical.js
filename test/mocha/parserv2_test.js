suite('parserv2', function() {

  var icsData;
  testSupport.defineSample('parserv2.ics', function(data) {
    icsData = data;
  });

  var subject;
  setup(function() {
    subject = ICAL.parsev2;
  });

  test('#parser', function() {
    var tree = subject(icsData);
    console.log(JSON.stringify(tree));
  });

  suite('#handleContentLine', function() {
    var state;

    setup(function() {
      state = {};
      state.stack = [];
      state.component = [
        'icalendar'
      ];
      state.tree = state.component;

      subject.handleContentLine('BEGIN:VCALENDAR', state);
    });

    function firstProperty() {
      return state.tree[1][1][0];
    }

    test('component begin/end', function() {
      subject.handleContentLine('BEGIN:VEVENT', state);
      assert.deepEqual(state.stack[1], ['vevent', [], []]);

      assert.deepEqual(
        state.tree,
        ['icalendar',
          ['vcalendar', [], [
            ['vevent', [], []]
          ]]
        ]
      );

      subject.handleContentLine('END:VEVENT', state);
      assert.length(state.stack, 1);
    });

    test('property with value', function() {
      var input = 'DESCRIPTION;X-FOO=foobar:value';
      var expected = [
        'description',
        { 'x-foo': 'foobar' },
        'text',
        'value'
      ];

      subject.handleContentLine(input, state);
      assert.deepEqual(firstProperty(), expected);
    });

    test('property with parameters and no value', function() {
      var input = 'ATTENDEE;ROLE="REQ-PARTICIPANT;foo";' +
                  'PARTSTAT=ACCEPTED;RSVP=TRUE';

      var params = {
        'role': 'REQ-PARTICIPANT;foo',
        'partstat': 'ACCEPTED',
        'rsvp': 'TRUE'
      };

      var expected = ['attendee', params, 'cal-address'];

      subject.handleContentLine(input, state);
      assert.deepEqual(firstProperty(), expected);
    });

    test('property with semicollon in value', function() {
      var input = 'RRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3';
      var expected = ['rrule', {}, 'recur', 'FREQ=YEARLY;BYDAY=2SU;BYMONTH=3'];

      subject.handleContentLine(input, state);
      assert.deepEqual(firstProperty(), expected);
    });

    test('property without attribute', function() {
      var input = 'DESCRIPTION:foobar';
      var expected = ['description', {}, 'text', 'foobar'];


      subject.handleContentLine(input, state);
      assert.deepEqual(firstProperty(), expected);
    });
  });

  suite('#_parseParameters', function() {
    test('without quotes', function() {
      var input = ';FOO=bar;BAR=foo';
      var expected = {
        'foo': 'bar',
        'bar': 'foo'
      };

      assert.deepEqual(
        subject._parseParameters(input, 0),
        expected
      );
    });

    test('with processed text', function() {
      var input = ';FOO=x\\na';
      var expected = {
        'foo': 'x\na'
      };

      assert.deepEqual(
        subject._parseParameters(input, 0),
        expected
      );
    });

    test('with quotes', function() {
      var input = ';ZOO=";woot;;wow";BAR=foo';
      var expected = {
        'zoo': ';woot;;wow',
        'bar': 'foo'
      };

      assert.deepEqual(
        subject._parseParameters(input, 0),
        expected
      );
    });
  });

  suite('#_parseValue', function() {
    test('datetime - without Z', function() {
      var value = '20120911T103000';
      var expected = '2012-09-11T10:30:00';

      assert.equal(
        subject._parseValue(value, 'date-time'),
        expected
      );
    });

    test('datetime - with Z', function() {
      var value = '20120911T103000Z';
      var expected = '2012-09-11T10:30:00Z';

      assert.equal(
        subject._parseValue(value, 'date-time'),
        expected
      );
    });

    test('date', function() {
      var value = '20120911';
      var expected = '2012-09-11';

      assert.equal(
        subject._parseValue(value, 'date'),
        expected
      );
    });

    test('text', function() {
      var value = 'start \\n next';
      var expected = 'start \n next';

      assert.equal(
        subject._parseValue(value, 'text'),
        expected
      );
    });
  });

  suite('#eachLine', function() {

    function unfold(input) {
      var result = [];

      subject.eachLine(input, function(err, line) {
        result.push(line);
      });

      return result;
    }

    test('unfold single with \r\n', function() {
      var input = 'foo\r\n bar';
      var expected = ['foobar'];

      assert.deepEqual(unfold(input), expected);
    });

    test('unfold multiple with \r\n', function() {
      var input = [
        'BEGIN:VCALENDAR',
        'X-DESC: i have a real',
        ' ly long desc',
        'END:VCALENDAR\n'
      ].join('\r\n');

      var expected = [
        'BEGIN:VCALENDAR',
        'X-DESC: i have a really long desc',
        'END:VCALENDAR'
      ];

      assert.deepEqual(unfold(input), expected);
    });

    test('with \n', function() {
      var input = 'foo\nbar\n  baz';
      var expected = [
        'foo',
        'bar baz'
      ];

      assert.deepEqual(unfold(input), expected);
    });

  });

});
