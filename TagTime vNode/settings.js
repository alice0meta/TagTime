{
	auth: {beeminder: "xxxxxxxxxxxxxxxxxxxx"}, // get your auth token from https://www.beeminder.com/api/v1/auth_token.json when signed in
	beeminder: {
		// CHANGEME by adding entries for each beeminder graph you want to auto-update
		// 'alice/work': 'job',                          // send 'job' pings to bmndr.com/alice/work
		// 'bob/play': 'fun and whee',                   // send 'fun whee' pings to bmndr.com/bob/play
		// 'bob/play': 'fun or whee',                    // send 'fun' pings and 'whee' pings to bmndr.com/bob/play
		// 'carol/nafk': 'not afk',                      // send pings that are not 'afk' pings to bmndr.com/carol/nafk
		// 'dave/socialgood': 'friends and not akrasia', // send 'friends' pings that are not 'akrasia' to bmndr.com/dave/socialgood
	'':''},
	retro_threshold: 60, // pings from more than this many seconds ago get autologged with tags "afk" and "RETRO". (Pings can be overdue either because the computer was off or tagtime was waiting for you to answer a previous ping. If the computer was off, the tag "off" is also added.)
	catchup: false, // whether it beeps for old pings, ie, should it beep a bunch of times in a row when the computer wakes from sleep.

	period: 45, // average number of minutes between pings
	seed: 666, // for pings not in sync with others, change this

	ping_file: 'pings.log', // file pings output to
	editor: '', // "CHANGEME if you don't like vi (eg: /usr/bin/pico)"
	terminal: '', // "CHANGEME to your path to xterm"
	enforce_nums: false, // whether it forces you to include a number in your ping response (include tag non or nonXX where XX is day  of month to override). This is for task editor integration.
'':''}