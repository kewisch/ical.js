if (testSupport.isNode) {
  var Benchmark = require('benchmark');
}

// we should really only require two + the latest
testSupport.requireBenchmarkBuild('pre1');
testSupport.requireBenchmarkBuild('beta1');

suite('parser benchmarks', function() {

  var icsData;
  var bench;

  testSupport.defineSample('parserv2.ics', function(data) {
    icsData = data;
  });

  suiteSetup(function() {
    bench = new Benchmark.Suite();
  });

  suiteSetup(function() {
    ['latest', 'beta1'].forEach(function(version) {
      // current version of ical
      var globalLib;
      // prefix name for test
      var prefix = version;

      if (version === 'latest') {
        globalLib = ICAL;
      } else {
        globalLib = this['ICAL_' + version];
      }

      if (!globalLib) {
        throw new Error('could not find ICAL_' + version);
      }

      bench.add(version + ': #parse', function() {
        var data = globalLib.parse(icsData);
      });

      bench.add(version + ': #stringify', function() {
        globalLib.stringify(parsed);
      });

      bench.add(version + ': subtract date', function() {
        var time = new globalLib.Time({
          year: 2012,
          month: 1,
          day: 1,
          hour: 10,
          minute: 3
        });

        var time2 = time = new globalLib.Time({
          year: 2012,
          month: 10,
          day: 1,
          hour: 1,
          minute: 55
        });

        time.subtractDate(time2);
      });

      var dur = new globalLib.Duration({
        days: 3,
        hour: 3,
        minutes: 3
      });

      bench.add(version + ': add duration', function() {
        var time = new globalLib.Time({
          year: 2012,
          month: 1,
          day: 32,
          seconds: 1
        });

        time.addDuration(dur);

        // to trigger normalization
        time.year;
      });

      bench.add(version + ': create and clone time', function() {
        var time = new globalLib.Time({
          year: 2012,
          month: 1,
          day: 32,
          seconds: 1
        });

        if (time.day !== 1) {
          throw new Error('test sanity fails for .day');
        }

        if (time.month !== 2) {
          throw new Error('test sanity fails for .month');
        }

        time.clone();
      });

      var parsed = globalLib.parse(icsData);
      var comp = new globalLib.Component(parsed[1]);
      var tz = comp.getFirstSubcomponent('vtimezone');
      var std = tz.getFirstSubcomponent('standard');
      var rrule = std.getFirstPropertyValue('rrule');

      bench.add(version + ': timezone iterator & first iteration', function() {
        var iterator = rrule.iterator(std.getFirstPropertyValue('dstart'));
        iterator.next();
      });
    });

  });

  test('benchmark', function(done) {
    this.timeout((bench.maxTime * 2) * 1000);
    // quick formatting hack
    console.log();

    bench.on('cycle', function(event) {
      console.log(String(event.target));
    });

    bench.on('complete', function(event) {
      done();
    });

    bench.run();
  });

});
