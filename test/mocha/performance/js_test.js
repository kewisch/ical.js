if (testSupport.isNode) {
  var Benchmark = require('benchmark');
}

suite('bench js', function() {

  var icsData;
  var bench;

  suiteSetup(function() {
    bench = new Benchmark.Suite();

    var value = '"\\\,\\\,foo \\\" bar"';
    var regex = /,?("[^"]+"|[^";:,]+)/g;

    function findNext(buffer, value, pos) {
      if (pos === undefined) {
        pos = 0;
      }
      while ((pos = buffer.indexOf(value, pos)) !== -1) {
        if (pos > 0 && buffer[pos - 1] === '\\') {
          pos += 1;
        } else {
          return pos;
        }
      }
    }

    bench.add('indexOf: find escaped value', function() {
      findNext(value, '"', 1);
    }, { maxTime: 1 });

    bench.add('regex: find escaped value', function() {
      value.match(regex);
    });

    return;

    var newLineString = 'my fooo bar \r\n xxx';
    var regexp = /\r?\n/;

    var i = 0;
    var maxDepth = 5;
    var indexOf = newLineString.indexOf('\n');

    for (; i < maxDepth; i++) {
      (function(depth) {
        var str = '';
        var startIndex = indexOf * depth;

        for (var i = 0; i <= depth; i++) {
          str += newLineString;
        }

        var seen = false;

        bench.add('find at depth #' + depth, function() {
          var value = str.indexOf('\n', startIndex + 1);
          if (!seen) {
            console.log(value);
            seen = true;
          }
        }, { maxTime: 1 });
      }(i));
    }
  });

  test('benchmark', function(done) {
    this.timeout((bench.maxTime * 2) * 1000);

    bench.on('cycle', function(event) {
      console.log(String(event.target), '<---?');
    });

    bench.on('complete', function(event) {
      done();
    });

    bench.run();
  });

});

