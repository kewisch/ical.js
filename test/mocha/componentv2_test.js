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
          ['xfoo', {}, 'text', 'xfoo3']
        ],
        [
          ['valarm', [], []],
          ['vtodo', [], []],
          ['valarm', [['description', {}, 'text', 'foo']], []]
        ]
      ]
    };

    subject = new ICAL.Componentv2(fixtures.components);
  });

  test('initialize component', function() {
    var raw = ['description', {}, 'text', 'value'];
    subject = new ICAL.Componentv2(raw);

    assert.equal(subject.jCal, raw, 'has jCal');
    assert.equal(subject.name, 'description');
  });

  test('new component without jCal', function() {
    var newComp = new ICAL.Componentv2('vevent');

    assert.equal(newComp.jCal[0], 'vevent');

    assert.ok(!newComp.getAllSubcomponents());
    assert.ok(!newComp.getAllProperties());
  });

  suite('#getFirstSubcomponent', function() {
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

  test('#addComponent', function() {
    var newComp = new ICAL.Componentv2('xnew');

    subject.addComponent(newComp);
    var all = subject.getAllSubcomponents();

    assert.equal(
      all[all.length - 1],
      newComp,
      'can reference component'
    );
  });

  suite('#removeComponent', function() {
    test('by name', function() {
      subject.removeComponent('vtodo');

      var all = subject.getAllSubcomponents();

      all.forEach(function(item) {
        assert.equal(item.name, 'valarm');
      });
    });

    test('by component', function() {
      var first = subject.getFirstSubcomponent();

      subject.removeComponent(first);

      assert.notEqual(
        subject.getFirstSubcomponent(),
        first
      );

      assert.equal(
        subject.getFirstSubcomponent().name,
        'vtodo'
      );
    });
  });

  suite('#removeAllComponents', function() {
    test('with name', function() {
      subject.removeAllComponents('valarm');
      assert.length(subject.jCal[2], 1);
      assert.equal(subject.jCal[2][0][0], 'vtodo');
      assert.length(subject.getAllSubcomponents(), 1);
    });

    test('all', function() {
      subject.removeAllComponents();
      assert.length(subject.jCal[2], 0);
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

  test('#addProperty', function() {
    var prop = new ICAL.Propertyv2('description');

    subject.addProperty(prop);
    assert.equal(subject.jCal[1][3], prop.jCal);

    var all = subject.getAllProperties();
    var lastProp = all[all.length - 1];

    assert.equal(lastProp, prop);
    assert.equal(lastProp.component, subject);
  });

  test('#addPropertyWithValue', function() {
    var subject = new ICAL.Componentv2('vevent');

    subject.addPropertyWithValue('description', 'value');

    var all = subject.getAllProperties();

    assert.equal(all[0].name, 'description');
    assert.equal(all[0].getFirstValue(), 'value');
  });

  test('#updatePropertyWithValue', function() {
    var subject = new ICAL.Componentv2('vevent');
    subject.addPropertyWithValue('description', 'foo');
    assert.length(subject.getAllProperties(), 1);

    subject.updatePropertyWithValue('description', 'xxx');

    assert.equal(subject.getFirstPropertyValue('description'), 'xxx');
    subject.updatePropertyWithValue('x-foo', 'bar');

    var list = subject.getAllProperties();
    assert.equal(subject.getFirstPropertyValue('x-foo'), 'bar');
  });

  suite('#removeProperty', function() {
    setup(function() {
      subject = new ICAL.Componentv2(
        fixtures.components
      );
    });

    test('try to remove non-existent', function() {
      var result = subject.removeProperty('wtfbbq');
      assert.isFalse(result);
    });

    test('remove by property', function() {
      var first = subject.getFirstProperty('description');

      var result = subject.removeProperty(first);
      assert.isTrue(result, 'removes property');

      assert.notEqual(
        subject.getFirstProperty('description'),
        first
      );

      assert.length(subject.jCal[1], 2);
    });

    test('remove by name', function() {
      // there are two descriptions
      var list = subject.getAllProperties();
      var first = subject.getFirstProperty('description');

      var result = subject.removeProperty('description');
      assert.isTrue(result);

      assert.notEqual(
        subject.getFirstProperty('description'),
        first
      );

      assert.length(list, 2);
    });
  });

  suite('#removeAllProperties', function() {
    test('no name when empty', function() {
      subject = new ICAL.Componentv2(
        fixtures.components
      );

      assert.length(subject.jCal[1], 3);

      subject.removeAllProperties();

      assert.length(subject.jCal[1], 0);
      assert.ok(!subject.getFirstProperty());
    });

    test('no name when not empty', function() {
      subject = new ICAL.Componentv2(['vevent', [], []]);
      subject.removeAllProperties();
      subject.removeAllProperties('xfoo');
    });

    test('with name', function() {
      subject = new ICAL.Componentv2(
        fixtures.components
      );

      subject.removeAllProperties('description');
      assert.length(subject.jCal[1], 1);

      var first = subject.getFirstProperty();

      assert.equal(first.name, 'xfoo');
      assert.equal(subject.jCal[1][0][0], 'xfoo');
    });
  });

  test('#toJSON', function() {
    var json = JSON.stringify(subject);
    var fromJSON = new ICAL.Componentv2(JSON.parse(json));

    assert.deepEqual(
      fromJSON.jCal,
      subject.jCal
    );
  });

  test('#toICAL', function() {
    var ical = subject.toICAL();
    var parsed = ICAL.parsev2(ical);
    var fromICAL = new ICAL.Componentv2(
      parsed[1]
    );

    assert.deepEqual(subject.jCal, fromICAL.jCal);
  });

});
