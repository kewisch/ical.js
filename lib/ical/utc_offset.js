ICAL.UtcOffset = (function() {

  function UtcOffset(aData) {
    this.hours = aData.hours;
    this.minutes = aData.minutes;
    this.factor = aData.factor;
  };

  UtcOffset.prototype = {

    hours: null,
    minutes: null,
    factor: null,

    icaltype: "utc-offset",

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


  return UtcOffset;

}());
