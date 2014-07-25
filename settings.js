// Settings for TagTime.
// This file must be in your home directory, called .tagtime.js

period: 45, // average number of minutes between pings
ping_file: '~/pings.log', //! autogenerate with user directory as name
beeminder: {
	auth: ['xxxxxxxxxxxxxxxxxxxx'], // get your auth token from https://www.beeminder.com/api/v1/auth_token.json when signed in
	grouping: true, // group pings by day
	//grouping: false, // have a datapoint for each ping
	//grouping: 'bob/play bob/work', // group pings for bob/play and bob/work but not any others

	// CHANGEME by adding entries for each beeminder graph you want to auto-update
	// 'alice/work': 'job',                 // send 'job' pings to bmndr.com/alice/work
	// 'bob/play': 'fun & whee',            // send 'fun whee' pings to bmndr.com/bob/play
	// 'bob/play': 'fun | whee',            // send 'fun' pings and 'whee' pings to bmndr.com/bob/play
	// 'carol/nafk': '! afk',               // send pings that are not 'afk' pings to bmndr.com/carol/nafk
	// 'carol/nafk': '¬ afk',               // send pings that are not 'afk' pings to bmndr.com/carol/nafk
	// 'dave/real-work': 'job & ! akrasia', // send 'job' pings that are not 'akrasia' to bmndr.com/dave/real-work
},
seed: 666, // for pings not in sync with other peoples' pings, change this
editor: '', //! todo: implement // "CHANGEME if you don't like vi (eg: /usr/bin/pico)"