ICAL.UtcOffset = (function() {

  function UtcOffset(aData) {
    if (aData) {
      this.hours = aData.hours;
      this.minutes = aData.minutes;
      this.factor = aData.factor;
    }
  }

  UtcOffset.prototype = {

    hours: null,
    minutes: null,
    factor: null,

    icaltype: "utc-offset",

    toSeconds: function() {
      return this.factor * (60 * this.minutes + 3600 * this.hours);
    },

    fromSeconds: function(aSeconds) {
      var secs = Math.abs(aSeconds);

      this.factor = aSeconds < 0 ? -1 : 1;
      this.hours = ICAL.helpers.trunc(secs / 3600);

      secs -= (this.hours * 3600);
      this.minutes = ICAL.helpers.trunc(secs / 60);
      return this;
    },


    toString: function toString() {
      return (this.factor == 1 ? "+" : "-") +
              ICAL.helpers.pad2(this.hours) + ':' +
              ICAL.helpers.pad2(this.minutes);
    }
  };

  UtcOffset.fromString = function(aString) {
    // -05:00
    var options = {};
    //TODO: support seconds per rfc5545 ?
    options.factor = (aString[0] === '+') ? 1 : -1;
    options.hours = ICAL.helpers.strictParseInt(aString.substr(1, 2));
    options.minutes = ICAL.helpers.strictParseInt(aString.substr(4, 2));

    return new ICAL.UtcOffset(options);
  };

  UtcOffset.fromSeconds = function(aSeconds) {
    var instance = new UtcOffset();
    instance.fromSeconds(aSeconds);
    return instance;
  };

  return UtcOffset;

}());
