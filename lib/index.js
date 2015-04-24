// Copied strictly required parts from test/helper.js
[
    'helpers',
    'recur_expansion',
    'event',
    'component_parser',
    'design',
    'parse',
    'stringify',
    'component',
    'property',
    'utc_offset',
    'binary',
    'period',
    'duration',
    'timezone',
    'timezone_service',
    'time',
    'recur',
    'recur_iterator'
].forEach(function(file) {
    require('./ical/' + file + '.js');
});

module.exports = global.ICAL;
