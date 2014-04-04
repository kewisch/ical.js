suite('Component', function() {
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

    subject = new ICAL.Component(fixtures.components);
  });

  suite("initialization", function() {
    test('initialize component', function() {
      var raw = ['description', {}, 'text', 'value'];
      subject = new ICAL.Component(raw);

      assert.equal(subject.jCal, raw, 'has jCal');
      assert.equal(subject.name, 'description');
    });

    test('new component without jCal', function() {
      var newComp = new ICAL.Component('vevent');

      assert.equal(newComp.jCal[0], 'vevent');

      assert.ok(!newComp.getAllSubcomponents());
      assert.ok(!newComp.getAllProperties());
    });

    test("#fromString", function() {
      var comp = ICAL.Component.fromString("BEGIN:VCALENDAR\nX-CALPROP:value\nEND:VCALENDAR");
      assert.equal(comp.name, "vcalendar");
      var prop = comp.getFirstProperty();
      assert.equal(prop.name, "x-calprop");
      assert.equal(prop.getFirstValue(), "value");
    });
  });

  suite('parenting', function() {
    // Today we hear a tale about Tom, Marge, Bernhard and Claire.
    var tom, bernhard, claire, marge, relationship
    var house, otherhouse;
    setup(function() {
      tom = new ICAL.Component("tom");
      bernhard = new ICAL.Component("bernhard");
      claire = new ICAL.Component("claire");
      marge = new ICAL.Component("marge");
      relationship = new ICAL.Component("vrelationship");
      house = new ICAL.Property("house");
      otherhouse = new ICAL.Property("otherhouse");
    });

    test('basic', function() {
      // Tom and Bernhard are best friends. They are happy and single.
      assert.isNull(tom.parent);
      assert.isNull(bernhard.parent);

      // One day, they get to know Marge, who is also single.
      assert.isNull(marge.parent);

      // Tom and Bernhard play rock paper scissors on who gets a first shot at
      // Marge and Tom wins. After a few nice dates they get together.
      relationship.addSubcomponent(tom);
      relationship.addSubcomponent(marge);

      // Both are happy as can be and tell everyone about their love. Nothing
      // goes above their relationship!
      assert.isNull(relationship.parent);
      assert.equal(tom.parent, relationship);
      assert.equal(marge.parent, relationship);

      // Over the years, there are a few ups and downs.
      relationship.removeSubcomponent(tom);
      assert.isNull(relationship.parent);
      assert.isNull(tom.parent);
      assert.equal(marge.parent, relationship);
      relationship.removeAllSubcomponents();
      assert.isNull(marge.parent);

      // But in the end they stay together.
      relationship.addSubcomponent(tom);
      relationship.addSubcomponent(marge);
    });

    test('multiple children', function() {
      // After some happy years Tom and Marge get married. Tom is going to be father
      // of his beautiful daughter Claire.
      tom.addSubcomponent(claire);

      // He has no doubt he is the father
      assert.equal(claire.parent, tom);

      // One day, Tom catches his wife in bed with his best friend Bernhard.
      // Tom is very unhappy and requests a paternity test. It turns out that
      // Claire is actually Bernhard's daughter.
      bernhard.addSubcomponent(claire);

      // Marge knew it all along. What a sad day. Claire is not Tom's daughter,
      // but instead Bernhard's. Tom has no children, and Bernhard is the happy
      // father of his daughter claire.
      assert.equal(claire.parent, bernhard);
      assert.isNull(tom.getFirstSubcomponent());
      assert.equal(bernhard.getFirstSubcomponent(), claire);
    });

    test('properties', function() {
      // Marge lives on a property near the Hamptons, she thinks it belongs to
      // her.
      marge.addProperty(house);
      assert.equal(house.parent, marge);

      // It seems that Tom didn't always trust Marge, he had fooled her. The
      // house belongs to him.
      tom.addProperty(house);
      assert.equal(house.parent, tom);
      assert.isNull(marge.getFirstProperty());

      // Bernhard being an aggressive character, tries to throw Tom out of his
      // own house. A long visit in the hospital lets neighbors believe noone
      // lives there anymore.
      tom.removeProperty(house);
      assert.isNull(house.parent);

      // Marge spends a few nights there, but also lives in her other house.
      marge.addProperty(house);
      marge.addProperty(otherhouse);
      assert.equal(house.parent, marge);
      assert.equal(otherhouse.parent, marge);

      // Tom is back from the hospital and very mad. He throws marge out of his
      // house. Unfortunately marge can no longer pay the rent for her other
      // house either.
      marge.removeAllProperties();
      assert.isNull(house.parent);
      assert.isNull(otherhouse.parent);

      // What a mess. What do we lern from this testsuite? Infidelity is not a
      // good idea. Always be faithful!
    });
  });

  suite('#getFirstSubcomponent', function() {
    var jCal;
    setup(function() {
      jCal = fixtures.components;
      subject = new ICAL.Component(jCal);
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

      subject = new ICAL.Component(
        fixtures.components
      );

      var result = subject.getAllSubcomponents();
      assert.length(result, comps.length);

      for (var i = 0; i < comps.length; i++) {
        assert.instanceOf(result[i], ICAL.Component);
        assert.equal(result[i].jCal, comps[i]);
      }
    });

    test('with name', function() {
      subject = new ICAL.Component(fixtures.components);

      var result = subject.getAllSubcomponents('valarm');
      assert.length(result, 2);

      result.forEach(function(item) {
        assert.equal(item.name, 'valarm');
      });
    });

    test('without components', function() {
      subject = new ICAL.Component(['foo', [], []]);
      assert.equal(subject.name, 'foo');
      assert.ok(!subject.getAllSubcomponents());
    });

    test('with name from end', function() {
      // We need our own subject for this test
      var oursubject = new ICAL.Component(fixtures.components);

      // Get one from the end first
      var comps = fixtures.components[2];
      oursubject.getAllSubcomponents(comps[comps.length - 1][0]);

      // Now get them all, they MUST be hydrated
      var results = oursubject.getAllSubcomponents();
      for (var i = 0; i < results.length; i++) {
        assert.isDefined(results[i]);
        assert.equal(results[i].jCal, subject.jCal[2][i]);
      }
    });
  });

  test('#addSubcomponent', function() {
    var newComp = new ICAL.Component('xnew');

    subject.addSubcomponent(newComp);
    var all = subject.getAllSubcomponents();

    assert.equal(
      all[all.length - 1],
      newComp,
      'can reference component'
    );

    assert.equal(
      all.length,
      subject.jCal[2].length,
      'has same number of items'
    );

    assert.equal(
      subject.jCal[2][all.length - 1],
      newComp.jCal,
      'adds jCal'
    );
  });

  suite('#removeSubcomponent', function() {
    test('by name', function() {
      subject.removeSubcomponent('vtodo');

      var all = subject.getAllSubcomponents();

      all.forEach(function(item) {
        assert.equal(item.name, 'valarm');
      });
    });

    test('by component', function() {
      var first = subject.getFirstSubcomponent();

      subject.removeSubcomponent(first);

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

  suite('#removeAllSubcomponents', function() {
    test('with name', function() {
      subject.removeAllSubcomponents('valarm');
      assert.length(subject.jCal[2], 1);
      assert.equal(subject.jCal[2][0][0], 'vtodo');
      assert.length(subject.getAllSubcomponents(), 1);
    });

    test('all', function() {
      subject.removeAllSubcomponents();
      assert.length(subject.jCal[2], 0);
      assert.ok(!subject.getAllSubcomponents());
    });
  });

  test('#hasProperty', function() {
    subject = new ICAL.Component(
      fixtures.components
    );

    assert.ok(subject.hasProperty('description'));
    assert.ok(!subject.hasProperty('iknowitsnothere'));
  });

  suite('#getFirstProperty', function() {
    setup(function() {
      subject = new ICAL.Component(fixtures.components);
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
      subject = new ICAL.Component(['foo', [], []]);
      assert.ok(!subject.getFirstProperty());
    });
  });

  test('#getFirstPropertyValue', function() {
    subject = new ICAL.Component(fixtures.components);
    assert.equal(
      subject.getFirstPropertyValue(),
      'xfoo'
    );
  });

  suite('#getAllProperties', function() {
    setup(function() {
      subject = new ICAL.Component(fixtures.components);
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

    test('with name from end', function() {
      // We need our own subject for this test
      var oursubject = new ICAL.Component(fixtures.components);

      // Get one from the end first
      var props = fixtures.components[1];
      oursubject.getAllProperties(props[props.length - 1][0]);

      // Now get them all, they MUST be hydrated
      var results = oursubject.getAllProperties();
      for (var i = 0; i < results.length; i++) {
        assert.isDefined(results[i]);
        assert.equal(results[i].jCal, subject.jCal[1][i]);
      }
    });
  });

  test('#addProperty', function() {
    var prop = new ICAL.Property('description');

    subject.addProperty(prop);
    assert.equal(subject.jCal[1][3], prop.jCal);

    var all = subject.getAllProperties();
    var lastProp = all[all.length - 1];

    assert.equal(lastProp, prop);
    assert.equal(lastProp.parent, subject);
  });

  test('#addPropertyWithValue', function() {
    var subject = new ICAL.Component('vevent');

    subject.addPropertyWithValue('description', 'value');

    var all = subject.getAllProperties();

    assert.equal(all[0].name, 'description');
    assert.equal(all[0].getFirstValue(), 'value');
  });

  test('#updatePropertyWithValue', function() {
    var subject = new ICAL.Component('vevent');
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
      subject = new ICAL.Component(
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
      subject = new ICAL.Component(
        fixtures.components
      );

      assert.length(subject.jCal[1], 3);

      subject.removeAllProperties();

      assert.length(subject.jCal[1], 0);
      assert.ok(!subject.getFirstProperty());
    });

    test('no name when not empty', function() {
      subject = new ICAL.Component(['vevent', [], []]);
      subject.removeAllProperties();
      subject.removeAllProperties('xfoo');
    });

    test('with name', function() {
      subject = new ICAL.Component(
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
    var fromJSON = new ICAL.Component(JSON.parse(json));

    assert.deepEqual(
      fromJSON.jCal,
      subject.jCal
    );
  });

  test('#toString', function() {
    var ical = subject.toString();
    var parsed = ICAL.parse(ical);
    var fromICAL = new ICAL.Component(parsed);

    assert.deepEqual(subject.jCal, fromICAL.jCal);
  });

});
