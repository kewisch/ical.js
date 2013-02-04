/**
 * Define a performance suite...
 */
(function(globals) {

  var VERSIONS = ['latest', 'previous'];

  function Context(bench, options) {
    this.bench = bench;

    if (options) {
      for (var key in options) {
        this[key] = options[key];
      }
    }

    if (typeof prefix !== 'undefined') {
      this.prefix = prefix;
    }
  }

  Context.prototype = {
    prefix: '',
    icalVersion: 'latest',

    icalObject: function() {
      if (this.icalVersion === 'latest') {
        return globals.ICAL;
      } else {
        return globals['ICAL_' + this.icalVersion];
      }
    },

    test: function(name, test) {
      var context = this;

      this.bench.add(
        this.prefix + name,
        test
      );
    },

    compare: function(suite) {
      VERSIONS.forEach(function(versionName) {
        var context = new Context(this.bench, {
          icalVersion: versionName,
          prefix: versionName + ': '
        });

        suite(context, context.icalObject());
      }, this);
    }
  };

  function perfSuite(name, scope) {
    var bench;
    if (testSupport.isNode) {
      bench = new (require('benchmark').Suite)();
    } else {
      bench = new Benchmark.Suite();
    }

    var context = new Context(bench);

    /**
     * This is somewhat lame because it requires you to manually
     * check the results (visually via console output) to actually
     * see what the performance results are...
     *
     * The intent is to define a nicer API while using our existing tools.
     * Later we will improve on the tooling to make this a bit more automatic.
     */
    suite(name, function() {
      scope.call(this, context);

      test('benchmark', function(done) {
        this.timeout(null);
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
  }

  function perfCompareSuite(name, scope) {
    perfSuite(name, function(perf) {
      perf.compare(scope);
    });
  }

  globals.perfSuite = perfSuite;
  globals.perfCompareSuite = perfCompareSuite;

}(
  (typeof window !== 'undefined') ? window : global
));
