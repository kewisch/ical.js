suite('propertyv2', function() {
  var fixtures;

  setup(function() {
    fixtures = {
      component: [
        'vevent',
        [],
        []
      ],

      noValue: [
        'x-foo',
        { prop: 'prop' },
        'text'
      ],

      textProp: [
        'description',
        {},
        'text',
        'foo'
      ],

      withParams: [
        'x-foo',
        {
          'rsvp': 'TRUE',
          'meta': 'foo'
        },
        'date',
        '2012-10-01'
      ],

      decoratedMutliValue: [
        'rdate',
        {},
        'date',
        '2012-10-10',
        '2012-10-11'
      ],

      mutliTextValue: [
        'categories',
        {},
        'text',
        'one',
        'two',
        'three'
      ]
    };
  });

  var subject;

  suite('initialization', function() {

    test('undecorated', function() {
      subject = new ICAL.Propertyv2(
        fixtures.textProp,
        fixtures.component
      );

      assert.equal(subject.jCal, fixtures.textProp);
      assert.equal(subject.name, 'description');
      assert.equal(subject.type, 'text');

      assert.isFalse(subject.isDecorated);
    });

    test('decorated', function() {
      subject = new ICAL.Propertyv2(
        fixtures.withParams,
        fixtures.component
      );

      assert.isTrue(subject.isDecorated);
    });
  });

  test('#getParameter', function() {
    subject = new ICAL.Propertyv2(
      fixtures.withParams
    );

    assert.equal(subject.getParameter('rsvp'), 'TRUE');
    assert.equal(subject.getParameter('wtf'), undefined);
  });

  test('#setParameter', function() {
    subject = new ICAL.Propertyv2(
      fixtures.textProp
    );

    subject.setParameter(
      'my-prop',
      'woot?'
    );

    assert.equal(
      subject.getParameter('my-prop'),
      'woot?'
    );

    assert.deepEqual(
      subject.jCal[1],
      { 'my-prop': 'woot?' }
    );
  });

  suite('getFirstValue', function() {

    test('with no value', function() {
      subject = new ICAL.Propertyv2(
        fixtures.noValue
      );

      assert.ok(!subject.getFirstValue());
    });

    test('with decorated type', function() {
      subject = new ICAL.Propertyv2(
        fixtures.withParams
      );

      var value = subject.getFirstValue();

      assert.instanceOf(value, ICAL.icaltime);
      //2012-10-01
      assert.hasProperties(
        value,
        { year: 2012, month: 10, day: 01, isDate: true },
        'property correctness'
      );

      assert.equal(
        subject.getFirstValue(),
        subject.getFirstValue(),
        'decorated equality'
      );
    });

    test('without decorated type', function() {
      subject = new ICAL.Propertyv2(fixtures.textProp);
      var value = subject.getFirstValue();

      assert.equal(
        value,
        subject.jCal[3]
      );
    });
  });

  suite('#getValues', function() {

    test('decorated', function() {
      subject = new ICAL.Propertyv2(
        fixtures.decoratedMutliValue
      );

      var result = subject.getValues();
      assert.length(result, 2);

      // 2012-10-10
      assert.hasProperties(
        result[0],
        {
          year: 2012,
          month: 10,
          day: 10,
          isDate: true
        }
      );

      //2012-10-11
      assert.hasProperties(
        result[1],
        {
          year: 2012,
          month: 10,
          day: 11,
          isDate: true
        }
      );
    });

    test('undecorated', function() {
      subject = new ICAL.Propertyv2(
        fixtures.mutliTextValue
      );

      var result = subject.getValues();
      assert.length(result, 3);
      assert.deepEqual(
        result,
        ['one', 'two', 'three']
      );
    });

    test('single value', function() {
      subject = new ICAL.Propertyv2(
        fixtures.textProp
      );
      assert.deepEqual(
        subject.getValues(),
        [subject.jCal[3]]
      );
    });

    test('no values', function() {
      subject = new ICAL.Propertyv2(fixtures.noValue);
      assert.ok(!subject.getValues());
    });

  });

});
