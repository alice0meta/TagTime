{
	period: 45, // average number of minutes between pings
	ping_file: '~/pings.log', // CHANGEME to <yourname>.log

	auth: {beeminder: 'xxxxxxxxxxxxxxxxxxxx'}, // get your auth token from https://www.beeminder.com/api/v1/auth_token.json when signed in
	beeminder: {
		// CHANGEME by adding entries for each beeminder graph you want to auto-update
		// 'alice/work': 'job',                 // send 'job' pings to bmndr.com/alice/work
		// 'bob/play': 'fun & whee',            // send 'fun whee' pings to bmndr.com/bob/play
		// 'bob/play': 'fun | whee',            // send 'fun' pings and 'whee' pings to bmndr.com/bob/play
		// 'carol/nafk': '! afk',               // send pings that are not 'afk' pings to bmndr.com/carol/nafk
		// 'carol/nafk': '¬ afk',               // send pings that are not 'afk' pings to bmndr.com/carol/nafk
		// 'dave/real-work': 'job & ! akrasia', // send 'job' pings that are not 'akrasia' to bmndr.com/dave/real-work
	},
	grouping: true, // group pings by day
	//grouping: false, // have a datapoint for each ping
	//grouping: 'bob/play bob/work', // group pings for bob/play and bob/work but not any others

	retro_threshold: 60, // pings from more than this many seconds ago get autologged with tags "afk" and "RETRO". (Pings can be overdue either because tagtime wasn't running or tagtime was waiting for you to answer a previous ping.)
	seed: 666, // for pings not in sync with other peoples' pings, change this
	gui: 'ping-nw', // options: ping-nw, ping-term //! note: ping-term is not yet implemented
	editor: '', //! todo: implement // "CHANGEME if you don't like vi (eg: /usr/bin/pico)"
}