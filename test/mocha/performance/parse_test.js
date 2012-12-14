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

      var parsed = globalLib.parse(icsData);

      bench.add(version + ': #parse', function() {
        var data = globalLib.parse(icsData);
      });

      bench.add(version + ': #stringify', function() {
        globalLib.stringify(parsed);
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
