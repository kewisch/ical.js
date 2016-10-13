suite('ICAL.helpers', function() {

  suite('#clone', function() {
    var subject = ICAL.helpers.clone;
    test('some primatives', function() {
      assert.equal(subject(null, false), null);
      assert.equal(subject(123, false), 123);
      assert.equal(subject(null, true), null);
      assert.equal(subject(123, true), 123);
    });

    test('a date', function() {
      var date = new Date(2015, 1, 1);
      var time = date.getTime();
      var copy = subject(date, false);

      copy.setYear(2016);
      assert.notEqual(time, copy.getTime());
    });

    test('clonable', function() {
      var obj = { clone: function() { return "test"; } };
      assert.equal(subject(obj, false), "test");
    });

    test('shallow array', function() {
      var obj = { v: 2 }
      var arr = [obj, 2, 3];

      var result = subject(arr, false);
      assert.deepEqual(result, [{ v: 2 }, 2, 3]);
      obj.v = 3;
      assert.deepEqual(result, [{ v: 3 }, 2, 3]);
    });

    test('deep array', function() {
      var obj = { v: 2 }
      var arr = [obj, 2, 3];

      var result = subject(arr, true);
      assert.deepEqual(result, [{ v: 2 }, 2, 3]);
      obj.v = 3;
      assert.deepEqual(result, [{ v: 2 }, 2, 3]);
    });

    test('shallow object', function() {
      var deepobj = { v: 2 };
      var obj = { a: deepobj, b: 2 };

      var result = subject(obj, false);
      assert.deepEqual(result, { a: { v: 2 }, b: 2 });
      deepobj.v = 3;
      assert.deepEqual(result, { a: { v: 3 }, b: 2 });
    });

    test('deep object', function() {
      var deepobj = { v: 2 };
      var obj = { a: deepobj, b: 2 };

      var result = subject(obj, true);
      assert.deepEqual(result, { a: { v: 2 }, b: 2 });
      deepobj.v = 3;
      assert.deepEqual(result, { a: { v: 2 }, b: 2 });
    });
  });

  suite('#pad2', function() {
    var subject = ICAL.helpers.pad2;

    test('with string', function() {
      assert.equal(subject(""), "00");
      assert.equal(subject("1"), "01");
      assert.equal(subject("12"), "12");
      assert.equal(subject("123"), "123");
    });

    test('with number', function() {
      assert.equal(subject(0), "00");
      assert.equal(subject(1), "01");
      assert.equal(subject(12), "12");
      assert.equal(subject(123), "123");
    });

    test('with boolean', function() {
      assert.equal(subject(true), "true");
    });
  });

  suite('#foldline', function() {
    var subject = ICAL.helpers.foldline;

    test('empty values', function() {
      assert.strictEqual(subject(null), "");
      assert.strictEqual(subject(""), "");
    });

    // Most other cases are covered by other tests
  });

  suite('#updateTimezones', function() {
    var subject = ICAL.helpers.updateTimezones;
    var cal;

    testSupport.defineSample('minimal.ics', function(data) {
      cal = new ICAL.Component(ICAL.parse(data));
    });
    testSupport.defineSample('timezones/America/Atikokan.ics', function(data) {
      ICAL.TimezoneService.register(
        (new ICAL.Component(ICAL.parse(data))).getFirstSubcomponent("vtimezone")
      );
    });

    test('timezones already correct', function() {
      var vtimezones;
      vtimezones = cal.getAllSubcomponents("vtimezone");
      assert.strictEqual(vtimezones.length, 1);
      assert.strictEqual(
        vtimezones[0].getFirstProperty("tzid").getFirstValue(),
        "America/Los_Angeles"
      );
    });

    test('remove extra timezones', function() {
      var vtimezones, atikokan;
      cal.addSubcomponent(
        ICAL.TimezoneService.get("America/Atikokan").component
      );
      vtimezones = cal.getAllSubcomponents("vtimezone");
      assert.strictEqual(vtimezones.length, 2);

      vtimezones = subject(cal).getAllSubcomponents("vtimezone");
      assert.strictEqual(vtimezones.length, 1);
      assert.strictEqual(
        vtimezones[0].getFirstProperty("tzid").getFirstValue(),
        "America/Los_Angeles"
      );
    });

    test('add missing timezones', function() {
      cal.getFirstSubcomponent("vevent").
        getFirstProperty("dtend").setParameter("tzid", "America/Atikokan");
      vtimezones = cal.getAllSubcomponents("vtimezone");
      assert(vtimezones.length, 1);
      
      vtimezones = subject(cal).getAllSubcomponents("vtimezone");
      assert.strictEqual(vtimezones.length, 2);
    });

    test('return non-vcalendar components unchanged', function() {
      var vevent = cal.getFirstSubcomponent("vevent");
      assert.deepEqual(subject(vevent), vevent);
    });
  });
});
