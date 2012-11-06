suite('componentv2', function() {
  var subject;
  var fixtures;

  setup(function() {
    fixtures = {
      components: [
        'vevent',
        [
          ['description', {}, 'text', 'xfoo'],
          ['description', {}, 'text', 'xfoo2'],
          ['xfoo', {}, 'text', 'xfoo2']
        ],
        [
          ['valarm', [], []],
          ['vtodo', [], []],
          ['valarm', [['description', {}, 'text', 'foo']]]
        ]
      ]
    };
  });

  test('initialize component', function() {
    var raw = ['description', {}, 'text', 'value'];
    subject = new ICAL.Componentv2(raw);

    assert.equal(subject.jCal, raw, 'has jCal');
    assert.equal(subject.name, 'description');
  });

  suite('getFirstSubcomponent', function() {
    var jCal;
    setup(function() {
      jCal = fixtures.components;
      subject = new ICAL.Componentv2(jCal);
    });

    test('without name', function() {
      var component = subject.getFirstSubcomponent();
      assert.equal(component.parent, subject);
      assert.equal(component.name, 'valarm');

      // first sub component
      var expected = jCal[2][0];

      assert.equal(component.jCal, expected);
    });

    test('with name (when not first)', function() {
      var component = subject.getFirstSubcomponent(
        'vtodo'
      );

      assert.equal(component.parent, subject);

      assert.equal(component.name, 'vtodo');
      assert.equal(
        component.jCal,
        jCal[2][1]
      );
    });

    test('with name (when there are two)', function() {
      var component = subject.getFirstSubcomponent(
        'valarm'
      );
      assert.equal(component.name, 'valarm');
      assert.equal(
        component.jCal,
        jCal[2][0]
      );
    });

    test('equality between calls', function() {
      assert.equal(
        subject.getFirstSubcomponent(),
        subject.getFirstSubcomponent()
      );
    });
  });

  suite('#getAllSubcomponents', function() {
    test('with components', function() {
      // 2 is the component array
      var comps = fixtures.components[2];

      subject = new ICAL.Componentv2(
        fixtures.components
      );

      var result = subject.getAllSubcomponents();
      assert.length(result, comps.length);

      for (var i = 0; i < comps.length; i++) {
        assert.instanceOf(result[i], ICAL.Componentv2);
        assert.equal(result[i].jCal, comps[i]);
      }
    });

    test('with name', function() {
      subject = new ICAL.Componentv2(fixtures.components);

      var result = subject.getAllSubcomponents('valarm');
      assert.length(result, 2);

      result.forEach(function(item) {
        assert.equal(item.name, 'valarm');
      });
    });

    test('without components', function() {
      subject = new ICAL.Componentv2(['foo', [], []]);
      assert.equal(subject.name, 'foo');
      assert.ok(!subject.getAllSubcomponents());
    });
  });

  test('#hasProperty', function() {
    subject = new ICAL.Componentv2(
      fixtures.components
    );

    assert.ok(subject.hasProperty('description'));
    assert.ok(!subject.hasProperty('iknowitsnothere'));
  });

  suite('#getFirstProperty', function() {
    setup(function() {
      subject = new ICAL.Componentv2(fixtures.components);
    });

    test('name missing', function() {
      assert.ok(!subject.getFirstProperty('x-foo'));
    });

    test('name has multiple', function() {
      var first = subject.getFirstProperty('description');
      assert.equal(first, subject.getFirstProperty());

      assert.equal(
        first.getFirstValue(),
        'xfoo'
      );
    });

    test('without name', function() {
      var first = subject.getFirstProperty();
      assert.equal(
        first.jCal,
        fixtures.components[1][0]
      );
    });

    test('without name empty', function() {
      subject = new ICAL.Componentv2(['foo', [], []]);
      assert.ok(!subject.getFirstProperty());
    });
  });

  test('#getFirstPropertyValue', function() {
    subject = new ICAL.Componentv2(fixtures.components);
    assert.equal(
      subject.getFirstPropertyValue(),
      'xfoo'
    );
  });

  suite('#getAllProperties', function() {
    setup(function() {
      subject = new ICAL.Componentv2(fixtures.components);
    });

    test('with name', function() {
      var results = subject.getAllProperties('description');
      assert.length(results, 2);

      results.forEach(function(item, i) {
        assert.equal(
          item.jCal,
          subject.jCal[1][i]
        );
      });
    });

    test('with name empty', function() {
      var results = subject.getAllProperties('wtfmissing');
      assert.deepEqual(results, []);
    });

    test('without name', function() {
      var results = subject.getAllProperties();
      results.forEach(function(item, i) {
        assert.equal(item.jCal, subject.jCal[1][i]);
      });
    });
  });

});
