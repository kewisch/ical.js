if (typeof(testSupport) === 'undefined') {
  this.testSupport = {};
}

testSupport.factory = {
  vcalComp: function() {
    return new ICAL.Component({
      type: 'COMPONENT',
      name: 'VCALENDAR'
    }, null);
  },

  veventComp: function() {
    return new ICAL.Component(this.vevent(
      this.propUUID()
    ));
  },

  vevent: function(props) {
    if (typeof(props) === 'undefined') {
      props = [];
    } else if (!(props instanceof Array)) {
      props = [props];
    }

    return {
      type: 'COMPONENT',
      name: 'VEVENT',
      value: props
    };
  },

  propUUID: function(uuid) {
    if (typeof(uuid) === 'undefined') {
      uuid = 'uuid-value';
    }

    return {
      name: 'UID',
      value: [uuid],
      type: 'TEXT'
    };
  }

};
