ICAL.ComponentParser = (function() {

  /**
   * Component parser initializer.
   *
   * Usage:
   *
   *    var options = {
   *      // when false no events will be emitted for type
   *      parseEvent: true,
   *      parseTimezone: true
   *    };
   *
   *    var parser = new ICAL.ComponentParser(options);
   *
   *    parser.onevent() {
   *      //...
   *    }
   *
   *    // ontimezone, etc...
   *
   *    parser.oncomplete = function() {
   *
   *    };
   *
   *    parser.process(string | component);
   *
   *
   * @param {Object} options component parser options.
   */
  function ComponentParser(options) {
    if (typeof(options) === 'undefined') {
      options = {};
    }

    var key;
    for (key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }
  }

  ComponentParser.prototype = {

    /**
     * When true parse events
     *
     * @type Boolean
     */
    parseEvent: true,

    /**
     * when true parse timezones
     *
     * @type Boolean
     */
    parseTimezone: true,


    /* SAX like events here for reference */

    /**
     * Fired when parsing is complete
     */
    oncomplete: function() {},

    /**
     * Fired if an error occurs during parsing.
     *
     * @param {Error} err details of error.
     */
    onerror: function(err) {},

    /**
     * Fired when a top level component (vtimezone) is found
     *
     * @param {ICAL.Timezone} timezone object.
     */
    ontimezone: function(component) {},

    /*
     * Fired when a top level component (VEVENT) is found.
     * @param {ICAL.Event} component top level component.
     */
    onevent: function(component) {},

    /**
     * Process a string or parse ical object.
     * This function itself will return nothing but
     * will start the parsing process.
     *
     * Events must be registered prior to calling this method.
     *
     * @param {String|Object} ical string or parsed ical object.
     */
    process: function(ical) {
      //TODO: this is sync now in the future we will have a incremental parser.
      if (typeof(ical) === 'string') {
        ical = ICAL.parse(ical);
      }

      if (!(ical instanceof ICAL.Component)) {
        ical = new ICAL.Component(ical);
      }

      var components = ical.getAllSubcomponents();
      var i = 0;
      var len = components.length;
      var component;

      for (; i < len; i++) {
        component = components[i];

        switch (component.name) {
          case 'vtimezone':
            if (this.parseTimezone) {
              var tzid = component.getFirstPropertyValue('tzid');
              if (tzid) {
                this.ontimezone(new ICAL.Timezone({
                  tzid: tzid,
                  component: component
                }));
              }
            }
            break;
          case 'vevent':
            if (this.parseEvent) {
              this.onevent(new ICAL.Event(component));
            }
            break;
          default:
            continue;
        }
      }

      //XXX: ideally we should do a "nextTick" here
      //     so in all cases this is actually async.
      this.oncomplete();
    }
  };

  return ComponentParser;

}());
