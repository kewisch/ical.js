/**
 * Define a performance suite...
 */
(function(globals) {

  var VERSIONS = ['latest', 'previous', 'upstream'];

  function Context(bench, options) {
    this.bench = bench;

    if (options) {
      for (var key in options) {
        this[key] = options[key];
      }
    }

  }

  Context.prototype = {
    prefix: '',
    icalVersion: 'latest',

    loadICAL: function(callback) {
      if (this.icalObject) {
        callback(this.icalObject);
      } else if (this.icalVersion) {
        if (this.icalVersion == "latest") {
          this.icalObject = globals.ICAL;
          callback(this.icalObject);
        } else {
          try {
            var self = this;
            testSupport.requireBenchmarkBuild(this.icalVersion, function(lib) {
              self.icalObject = lib;
              if (!self.icalObject) {
                console.log('Version ICAL_' + self.icalVersion + ' not found, skipping');
              }
              callback(self.icalObject);
            });
          } catch (e) {
            console.log('Version ICAL_' + this.icalVersion + ' not found, skipping');
            this.icalObject = null;
            callback(null);
          }
        }
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

        context.loadICAL(function(ICAL) {
          if (ICAL) {
            suite(context, ICAL);
          }
        });
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
        this.timeout(0);
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
