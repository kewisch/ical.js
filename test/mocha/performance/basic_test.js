var Benchmark = require('benchmark');
testSupport.requireICAL();

suite('bench', function() {

  var icsData;

  testSupport.defineSample('daily_recur.ics', function(data) {
    icsData = data;
  });

  function runBenchmark(bench, name) {
    test(name, function(done) {
      this.timeout((bench.maxTime * 2) * 1000);

      bench.on('cycle', function(event) {
        console.log(String(event.target), '<---?');
      });

      bench.on('complete', function(event) {
        done();
      });

      bench.run({ name: name });
    });
  }

  var bench = new Benchmark.Suite();

  var versions = ['pre1', 'latest'].forEach(function(version) {
    // current version of ical
    var globalLib;

    // prefix name for test
    var prefix = version;

    if (version === 'latest') {
      globalLib = ICAL;
    } else {
      testSupport.requireBenchmarkBuild(version);
      globalLib = this['ICAL_' + version];
    }

    if (!globalLib) {
      throw new Error('could not find ICAL_' + version);
    }

    bench.add(version + ': #parse (daily recurring event)', function() {
      var data = globalLib.parse(icsData);
    });
  });

  runBenchmark(bench, 'ICAL.parse');
});
