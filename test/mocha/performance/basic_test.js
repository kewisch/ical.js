if (testSupport.isNode) {
  var Benchmark = require('benchmark');
}

testSupport.requireBenchmarkBuild('pre1');
testSupport.requireICAL();

suite('bench', function() {

  var icsData;
  var bench;

  testSupport.defineSample('daily_recur.ics', function(data) {
    icsData = data;
  });

  suiteSetup(function() {
    bench = new Benchmark.Suite();
    var seen = false;

    bench.add('#parse v2', function() {
      var data = ICAL.parsev2(icsData);
    });

    ['pre1', 'latest'].forEach(function(version) {
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

      bench.add(version + ': #parse (daily recurring event)', function() {
        var data = globalLib.parse(icsData);
      });
    });

  });

  test('benchmark', function(done) {
    this.timeout((bench.maxTime * 2) * 1000);

    bench.on('cycle', function(event) {
      console.log(String(event.target));
    });

    bench.on('complete', function(event) {
      done();
    });

    bench.run();
  });

});
