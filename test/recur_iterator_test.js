suite('recur_iterator', function() {
  var recur;
  var iterator;
  var Time = ICAL.Time;
  var Recur = ICAL.Recur;

  function addDates(expected, year, month, dates) {
    dates.forEach(function(date) {
      expected.push(new Date(
        year, month, date, 9
      ));
    });
  }

  function createDay(date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  }

  function isSameDate(first, second) {
    return first.getMonth() == second.getMonth() &&
           first.getDate() == second.getDate() &&
           first.getFullYear() == second.getFullYear();
  }

  // taken from gaia calendar app
  function datesBetween(start, end, includeTime) {
    var list = [];
    var last = start.getDate();
    var cur;

    while (true) {
      var next = new Date(
        start.getFullYear(),
        start.getMonth(),
        ++last
      );

      if (next > end) {
        throw new Error(
          'sanity fails next is greater then end'
        );
      }

      if (!isSameDate(next, end)) {
        list.push(next);
        continue;
      }

      break;
    }

    if (includeTime) {
      list.unshift(start);
      list.push(end);
    } else {
      list.unshift(createDay(start));
      list.push(createDay(end));
    }

    return list;
  }

  function createIterator(ruleString, timeString) {
    setup(function() {
      var start = ICAL.Time.fromString(timeString);
      recur = ICAL.Recur.fromString(ruleString);
      iterator = recur.iterator(start);
    });
  }

  function getDaysIn(month) {
    var start = new Date(
      month.getFullYear(),
      month.getMonth(),
      1
    );
    var end = new Date(start.valueOf());
    end.setMonth(start.getMonth() + 1);
    end.setMilliseconds(-1);

    return datesBetween(start, end);
  }

  suite('#toJSON', function() {
    createIterator(
      'FREQ=MONTHLY;COUNT=12;INTERVAL=3',
      '2012-02-01T09:00:00'
    );

    test('completed', function() {
      var next;
      while (iterator.next()) {}

      assert.isTrue(iterator.completed, 'is completed');

      var json = iterator.toJSON();
      var newIter = new ICAL.RecurIterator(json);

      assert.equal(newIter.next(), null, 'new iter next');
      assert.isTrue(newIter.completed, true, 'new iter completed');
    });

    test('INTERVAL: mid iteration (two iterations)', function() {
      iterator.next();
      iterator.next();

      var json = iterator.toJSON();
      var newIter = new ICAL.RecurIterator(json);
      var inc = 0;

      while (inc++ < 8) {
        assert.deepEqual(
          iterator.next().toJSDate(),
          newIter.next().toJSDate(),
          'failed #' + inc
        );
      }
    });

    test('from the begining of iteration', function() {
      var expected = {
        rule: iterator.rule.toJSON(),
        dtstart: iterator.dtstart.toJSON(),
        by_data: iterator.by_data,
        days: iterator.days,
        initialized: true,
        last: iterator.last.toJSON(),
        by_indices: iterator.by_indices,
        occurrence_number: iterator.occurrence_number
      };

      var json = iterator.toJSON();
      assert.deepEqual(json, expected);

      var newIter = new ICAL.RecurIterator(json);
      var inc = 0;

      while (inc++ < 10) {
        assert.deepEqual(
          newIter.next().toJSDate(),
          iterator.next().toJSDate(),
          'iterator equality #' + inc
        );
      }
    });

  });

  suite('#normalizeByMonthDayRules', function() {
    createIterator(
      'FREQ=MONTHLY;COUNT=2',
      '2012-02-01T09:00:00'
    );
    test('positive rules', function() {
      var result = iterator.normalizeByMonthDayRules(
        2012, 2, [21, 15]
      );

      assert.deepEqual(result, [15, 21]);
    });

    test('when given zero', function() {
      var result = iterator.normalizeByMonthDayRules(
        2012, 2, [21, 0]
      );

      assert.deepEqual(result, [21]);
    });

    test('extra days', function() {
      var result = iterator.normalizeByMonthDayRules(
        2012, 2, [1, 31]
      );

      assert.deepEqual(result, [1]);
    });

    test('negative and positive days', function() {
      var result = iterator.normalizeByMonthDayRules(
        2012, 2, [1, -1]
      );

      assert.deepEqual(result, [1, 29]);
    });

    test('duplicates', function() {
      var result = iterator.normalizeByMonthDayRules(
        // -29 === 1st day
        2012, 2, [2, 2, 1, -29]
      );

      assert.deepEqual(result, [1, 2]);
    });

  });

  suite('weekly until', function() {
    createIterator(
      'FREQ=WEEKLY;UNTIL=2012-04-24T06:59:59Z;BYDAY=TU',
      '2012-04-10T09:00:00'
    );

    test('until complete', function() {
      var next;
      var dates = [];

      assert.isTrue(recur.isFinite(), 'finite');

      var max = 3;
      var inc = 0;

      var expected = [
        new Date(2012, 3, 10, 9),
        new Date(2012, 3, 17, 9)
      ];

      while (inc++ < max && (next = iterator.next())) {
        var value = next.toJSDate();
        dates.push(value);
      }

      assert.deepEqual(dates, expected);
    });
  });

  suite('daily on weekdays', function() {
    createIterator(
      'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
      '2012-01-02T09:00:00'
    );

    test('9 occurrences', function() {
      var next;
      var dates = [];

      assert.isFalse(recur.isFinite(), 'finite');

      var max = 9;
      var inc = 0;

      var expected = [
        new Date(2012, 0, 2, 9),
        new Date(2012, 0, 3, 9),
        new Date(2012, 0, 4, 9),
        new Date(2012, 0, 5, 9),
        new Date(2012, 0, 6, 9),
        new Date(2012, 0, 9, 9),
        new Date(2012, 0, 10, 9),
        new Date(2012, 0, 11, 9),
        new Date(2012, 0, 12, 9),
        new Date(2012, 0, 13, 9)
      ];

      while (inc <= max) {
        var value = iterator.next().toJSDate();
        dates.push(value);
        inc++;
      }

      assert.deepEqual(
        expected,
        dates
      );
    });
  });

  suite('yearly & by month', function() {

    test('infinite', function() {
      var raw = 'FREQ=YEARLY;BYMONTH=3;BYDAY=TU';
      var start = '1970-03-08T02:00:00';
      var recur = ICAL.Recur.fromString(raw);
      var start = ICAL.Time.fromString(start);

      var iterator = recur.iterator(start);
      var limit = 1;
      var cur = 0;

      var rootDate = new Date(
        1970, 2
      );

      while (limit > cur++) {
        var next = iterator.next();
        var date = next.toJSDate();

        assert.equal(
          date.getMonth(), 2,
          'expected March for year ' + String(1970 + cur)
        );
      }
    });

  });

  suite('daily for 10 occurrences', function() {
    createIterator(
      'FREQ=DAILY;COUNT=10',
      '2012-09-01T09:00:00'
    );

    test('until end', function() {
      var calls = 0;
      var next;

      assert.isTrue(recur.isFinite(), 'finite');
      assert.isTrue(recur.isByCount(), 'by count');

      while ((next = iterator.next())) {
        ++calls;
        assert.equal(iterator.occurrence_number, calls);
        assert.deepEqual(
          new Date(2012, 8, calls, 9),
          next.toJSDate()
        );
      }
      assert.equal(calls, 10);
    });
  });

  suite('every other day - forever', function() {
    createIterator(
      'FREQ=DAILY;INTERVAL=2',
      '2012-09-01T09:00:00'
    );

    test('10 times', function() {
      assert.isFalse(recur.isFinite(), 'finite');
      assert.isFalse(recur.isByCount(), 'by count');

      var max = 10;
      var cur = 0;
      var next;

      while (cur < max && (next = iterator.next())) {
        cur++;
        assert.equal(iterator.occurrence_number, cur);
        // cur is 1 based we want zero based so -1
        // 1 + ((cur - 1) * 2) == 1, 3, 5, etc..
        var nextDay = 1 + ((cur - 1) * 2);
        assert.deepEqual(
          next.toJSDate(),
          new Date(2012, 8, 1 + ((cur - 1) * 2), 9)
        );
      }
    });
  });


  suite('every 10 days, 5 occurrences', function() {
    createIterator(
      'FREQ=DAILY;INTERVAL=10;COUNT=5',
      '2012-09-01T09:00:00'
    );

    test('until end', function() {
      var calls = 0;
      var next;

      assert.isTrue(recur.isFinite(), 'is finite');
      assert.isTrue(recur.isByCount(), 'is by count');

      while ((next = iterator.next())) {
        calls++;
        assert.equal(iterator.occurrence_number, calls);
        var expected = new Date(
          2012,
          8,
          1 + ((calls - 1) * 10),
          9
        );

        assert.deepEqual(
          next.toJSDate(),
          expected
        );
      }

      assert.equal(calls, 5);
    });
  });

  suite('every day in January, for 3 years', function() {
    createIterator(
      'FREQ=YEARLY;UNTIL=2015-01-31T09:00:00Z;BYMONTH=1;BYDAY=SU,MO,TU,WE,TH,FR,SA',
      '2012-05-01T09:00:00'
    );

    var months = [
      new Date(2013, 0),
      new Date(2014, 0),
      new Date(2015, 0)
    ];

    test('until end', function() {
      // take list of months and convert each month to an
      // array of single dates. Then reduce list into
      // one array of dates.
      var expected = months.map(getDaysIn).reduce(function(a, b) {
        return a.concat(b);
      });

      // then set the hour
      expected.forEach(function(date) {
        date.setHours(9);
      });

      var dates = [];
      var endDate = ICAL.Time.fromString('2015-01-31T09:00:00Z');
      var max = expected.length;
      var calls = 0;
      var next;

      assert.isTrue(recur.isFinite(), 'is finite');
      assert.deepEqual(
        recur.until.toJSDate(),
        endDate.toJSDate()
      );

      while ((next = iterator.next())) {
        if (calls > (max + 90)) {
          throw new Error(
            'Too many dates created expected maximum of: ' + max +
            ' currently at: ' + calls + ''
          );
          break;
        }
        calls++;
        dates.push(next.toJSDate());
      }

      assert.length(dates, expected.length);
      assert.deepEqual(dates.sort(), expected.sort());
      assert.equal(calls, expected.length);
    });
  });

  suite('weekly for 10 occurrences', function() {
    createIterator(
      'FREQ=WEEKLY;COUNT=10',
      '2012-01-05T09:00:00'
    );

    var expected = [
      new Date(2012, 0, 5, 9),
      new Date(2012, 0, 12, 9),
      new Date(2012, 0, 19, 9),
      new Date(2012, 0, 26, 9),
      new Date(2012, 1, 2, 9),
      new Date(2012, 1, 9, 9),
      new Date(2012, 1, 16, 9),
      new Date(2012, 1, 23, 9),
      new Date(2012, 2, 1, 9),
      new Date(2012, 2, 8, 9)
    ];

    test('until end', function() {
      assert.isTrue(recur.isFinite(), 'finite');
      var dates = [];
      var next;

      while ((next = iterator.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(
        dates,
        expected
      );
    });
  });

  suite('Weekly until December 24, 2012', function() {
    createIterator(
      'FREQ=WEEKLY;UNTIL=2012-12-24T00:00:00Z',
      '2012-11-15T00:00:00'
    );

    var expected = [
      new Date(2012, 10, 15),
      new Date(2012, 10, 22),
      new Date(2012, 10, 29),
      new Date(2012, 11, 6),
      new Date(2012, 11, 13),
      new Date(2012, 11, 20)
    ];

    test('until end', function() {
      var next;
      var dates = [];

      assert.isTrue(recur.isFinite(), 'finite');

      while ((next = iterator.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(
        dates,
        expected
      );
    });
  });

  suite('every other week forever', function() {
    createIterator(
      'FREQ=WEEKLY;INTERVAL=2;WKST=SU',
      '2012-01-15T09:00:00'
    );

    var expected = [
      new Date(2012, 0, 15, 9),
      new Date(2012, 0, 29, 9),
      new Date(2012, 1, 12, 9),
    ];

    test(expected.length + ' occurrences', function() {
      var next;
      var cur = 0;
      var max = expected.length;
      var dates = [];

      assert.isFalse(recur.isFinite(), 'finite');

      while(cur < max && (next = iterator.next())) {
        dates.push(next.toJSDate())
        cur++;
      }

      assert.deepEqual(
        dates,
        expected
      );
    });
  });

  suite('weekly on tuesday and thursday for five weeks', function() {
    createIterator(
      'FREQ=WEEKLY;COUNT=4;WKST=SU;BYDAY=TU,TH',
      '2012-01-01T09:00:00'
    );

    var expected = [
      new Date(2012, 0, 3, 9),
      new Date(2012, 0, 5, 9),
      new Date(2012, 0, 10, 9),
      new Date(2012, 0, 12, 9)
    ];

    test('until end', function() {
      var next;
      var dates = [];

      assert.isTrue(recur.isFinite(), 'finite');

      var inc = 0;
      var max = 10;

      while ((next = iterator.next())) {
        inc++;
        if (inc > max) {
          throw new Error('max');
        }
        dates.push(next.toJSDate());
      }

      assert.deepEqual(dates, expected);
    });
  });

  suite('every other week on mo,we,fi until dec 24th 1997', function() {
    createIterator(
      'FREQ=WEEKLY;INTERVAL=2;UNTIL=1997-12-24T09:00:00Z;WKST=SU;BYDAY=MO,WE,FR',
      '1997-09-01T09:00:00'
    );

    var expected = [];

    // taken directly from rfc
    addDates(expected, 1997, 8, [1, 3, 5, 15, 17, 19, 29]);
    addDates(expected, 1997, 9, [1, 3, 13, 15, 17, 27, 29, 31]);
    addDates(expected, 1997, 10, [10, 12, 14, 24, 26, 28]);
    addDates(expected, 1997, 11, [8, 10, 12, 22, 24]);

    test('until end', function() {
      var dates = [];
      var next;

      assert.isTrue(recur.isFinite(), 'finite');

      while ((next = iterator.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(
        dates,
        expected
      );
    });

  });

  suite('monthly on first friday for 10 occurrences', function() {
    createIterator(
      'FREQ=MONTHLY;COUNT=10;BYDAY=1FR',
      '2012-01-07T00:00:00'
    );

    var expected = [
      // note we skipped the first friday of jan
      // because the start date is _after_ that day.
      new Date(2012, 1, 3),
      new Date(2012, 2, 2),
      new Date(2012, 3, 6),
      new Date(2012, 4, 4),
      new Date(2012, 5, 1),
      new Date(2012, 6, 6),
      new Date(2012, 7, 3),
      new Date(2012, 8, 7),
      new Date(2012, 9, 5),
      new Date(2012, 10, 2)
    ];

    test('until end', function() {
      var next;
      var dates = [];

      assert.isTrue(recur.isFinite(), 'finite');

      while ((next = iterator.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(
        dates,
        expected
      );
    });
  });

  suite('every thursday 31th forever', function() {
    createIterator(
      'FREQ=MONTHLY;BYDAY=TH;BYMONTHDAY=31',
      '2012-01-31T09:00:00'
    );

    var expected = [
      new Date(2012, 4, 31, 9),
      new Date(2013, 0, 31, 9),
      new Date(2013, 9, 31, 9)
    ];

    test('for 3 occurrences', function() {
      var next;
      var dates = [];
      var inc = 0;
      var max = 3;

      while (inc < max) {
        var value = iterator.next().toJSDate();
        dates.push(value);
        inc++;
      }

      assert.deepEqual(
        dates,
        expected
      );
    });
  });

  suite('every other month; first and last sunday for 4 occurrences', function() {
    createIterator(
      'FREQ=MONTHLY;INTERVAL=2;COUNT=4;BYDAY=1SU,-1SU',
      '2012-11-01T09:00:00'
    );

    var expected = [
      // nov 2012
      new Date(2012, 10, 4, 9),
      new Date(2012, 10, 25, 9),
      // jan 2013
      new Date(2013, 0, 6, 9),
      new Date(2013, 0, 27, 9)
    ];

    test('until end', function() {
      var next;
      var dates = [];

      assert.isTrue(recur.isFinite(), 'finite');

      while ((next = iterator.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(dates, expected);
    });
  });

  suite('monthly third to last day of month forever', function() {
    createIterator(
      'FREQ=MONTHLY;BYMONTHDAY=-3',
      '2012-01-01T09:00:00'
    );

    var expected = [
      new Date(2012, 0, 29, 9),
      new Date(2012, 1, 27, 9),
      new Date(2012, 2, 29, 9)
    ];

    test('three occurrences', function() {
      var next;
      var max = 3;
      var cur = 0;
      var dates = [];

      assert.isFalse(recur.isFinite(), 'finite');

      while (cur++ < max && (next = iterator.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(dates, expected);
    });
  });

  suite('weekly WKST changes output', function() {

    suite('MO', function() {
      createIterator(
        'FREQ=WEEKLY;INTERVAL=2;COUNT=4;BYDAY=TU,SU;WKST=MO',
        '1997-08-05T09:00:00'
      );

      var expected = [];

      addDates(expected, 1997, 7, [5, 10, 19, 24]);

      test('until end', function() {
        var dates = [];
        var next;

        while ((next = iterator.next())) {
          dates.push(next.toJSDate());
        }

        assert.deepEqual(dates, expected);
      });
    });

    suite('SU', function() {
      createIterator(
        'FREQ=WEEKLY;INTERVAL=2;COUNT=4;BYDAY=TU,SU;WKST=SU',
        '1997-08-05T09:00:00'
      );

      var expected = [];

      addDates(expected, 1997, 7, [5, 17, 19, 31]);

      test('until end', function() {
        var dates = [];
        var next;

        while ((next = iterator.next())) {
          dates.push(next.toJSDate());
        }

        assert.deepEqual(dates, expected);
      });

    });
  });

  suite('monthly, the third instance of tu,we,th', function() {
    // TODO: we need to fix this case its confirmed failing.
    return;
    createIterator(
      'FREQ=MONTHLY;COUNT=3;BYDAY=TU,WE,TH;BYSETPOS=3',
      '1997-09-04T09:00:00'
    );

    // taken directly from rfc
    var expected = [
      new Date(1997, 8, 4, 9),
      new Date(1997, 9, 7, 9),
      new Date(1997, 10, 6, 9)
    ];

    test('until end', function() {
      var next;
      var dates = [];

      assert.isTrue(recur.isFinite(), 'finite');

      while ((next = iterator.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(dates, expected);
    });
  });

  suite('monthly, each month last day that is monday', function() {
    createIterator(
      'FREQ=MONTHLY;BYMONTHDAY=-1;BYDAY=MO',
      '2012-01-01T09:00:00'
    );

    var expected = [
      new Date(2012, 3, 30, 9),
      new Date(2012, 11, 31, 9)
    ];

    test(expected.length + ' occurrences', function() {
      var next;
      var dates = [];
      assert.isFalse(recur.isFinite(), 'finite');

      var max = expected.length;
      var inc = 0;

      while ((inc++ < max) && (next = iterator.next())) {
        dates.push(next.toJSDate());
      }

      assert.deepEqual(dates, expected);
    });
  });

  suite('weekly on tuesday', function() {
    createIterator(
      'FREQ=WEEKLY;BYDAY=TU',
      '2012-09-11T09:00:00'
    );

    test('for 5 occurrences', function() {
      var next;
      var dates = [];

      assert.isFalse(recur.isFinite(), 'finite');

      var expected = [
        new Date(2012, 8, 11, 9),
        new Date(2012, 8, 18, 9),
        new Date(2012, 8, 25, 9),
        new Date(2012, 9, 2, 9),
        new Date(2012, 9, 9, 9)
      ];

      var inc = 0;
      var max = 5;

      while (inc < max) {
        var value = iterator.next().toJSDate();
        dates.push(value);
        inc++;
      }

      assert.deepEqual(
        dates,
        expected
      );

    });
  });

  suite('buisness days for 50 occurances', function() {
    createIterator(
      'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
      '2012-01-02T09:00:00'
    );

    test('for 50 occurances', function() {
      var next;
      var dates = [];

      // must start at multiple of 5
      var max = 50;

      var inc = 0;

      var expected = [];
      var expectedNum = max;
      var date = new Date(2012, 0, 2, 9);

      while (expectedNum--) {
        // save the previous date
        expected.push(date);

        date = new Date(date.valueOf());

        if ((expectedNum % 5) === 0) {
          date.setDate(date.getDate() + 3);
        } else {
          date.setDate(date.getDate() + 1);
        }
      }

      while (inc < max) {
        var value = iterator.next().toJSDate();
        dates.push(value);
        inc++;
      }

      assert.deepEqual(expected, dates);
    });

  });

  suite('every friday 13th forever', function() {
    createIterator(
      'FREQ=MONTHLY;BYDAY=FR;BYMONTHDAY=13',
      '2012-04-01T09:00:00'
    );

    test('for 3 occurrences', function() {
      var next;
      var dates = [];

      assert.isFalse(recur.isFinite(), 'finite');

      var max = 3;
      var inc = 0;

      var expected = [
        new Date(2012, 3, 13, 9),
        new Date(2012, 6, 13, 9),
        new Date(2013, 8, 13, 9)
      ];

      while (inc < max) {
        var value = iterator.next().toJSDate();
        dates.push(value);
        inc++;
      }

      assert.deepEqual(
        dates,
        expected
      );

    });
  });
  suite('Every 11th & 31st every month', function() {
    createIterator(
      'FREQ=MONTHLY;BYMONTHDAY=11,31',
      '2013-04-01T08:00:00'
    );

    test('for 6 occurrences', function() {
      var next;
      var dates = [];
      
      assert.isFalse(recur.isFinite(), 'finite');

      var max = 6;
      var inc = 0;

      var expected = [
        new Date(2013, 3, 11, 8),
        new Date(2013, 4, 11, 8),
        new Date(2013, 4, 31, 8),
        new Date(2013, 5, 11, 8),
        new Date(2013, 6, 11, 8),
        new Date(2013, 6, 31, 8)
      ];

      while (inc < max) {
        var value = iterator.next().toJSDate();
        dates.push(value);
        inc++;
      }

      assert.deepEqual(
        dates,
        expected
      );

    });
  });

  suite('Every WE & SA the 6th, 20th & 31st every month', function() {
    createIterator(
      'FREQ=MONTHLY;BYDAY=WE,SA;BYMONTHDAY=6,20,31',
      '2013-07-01T08:00:00'
    );

    test('for 6 occurrences', function() {
      var next;
      var dates = [];
      
      assert.isFalse(recur.isFinite(), 'finite');

      var max = 6;
      var inc = 0;

      var expected = [
        new Date(2013, 6, 6, 8),
        new Date(2013, 6, 20, 8),
        new Date(2013, 6, 31, 8),
        new Date(2013, 7, 31, 8),
        new Date(2013, 10, 6, 8),
        new Date(2013, 10, 20, 8)
      ];

      while (inc < max) {
        var value = iterator.next().toJSDate();
        dates.push(value);
        inc++;
      }

      assert.deepEqual(
        dates,
        expected
      );

    });
  });
});


