'use strict';

require('touchka-bootstrap')(function() { 
	require('./app');
}, 4, function() {
	require('touchka-argv')(require('./cli.help.js'), './config.json');
});
