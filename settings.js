// Settings for TagTime. Edit me if you want to send pings to Beeminder graphs!
{
	"period": 45, // average number of minutes between pings
	"ping_file": ‹'"~/TagTime/'+process.env.HOME.replace(/^\/Users\//,'')+'.log"'›,
	"beeminder": {
		// get your auth token from https://www.beeminder.com/api/v1/auth_token.json
		"auth": "xxxxxxxxxxxxxxxxxxxx",
		"grouping": true // group pings by day
		// "grouping": false, // have a datapoint for each ping
		// "grouping": "bob/play bob/work", // group pings for these but not any others

		// CHANGEME by adding entries for each beeminder graph you want to auto-update
		// send "job" pings to bmndr.com/alice/work:
		// "alice/work": "job",
		// send "fun whee" pings to bmndr.com/bob/play:
		// "bob/play": "fun & whee",
		// send "fun" pings and "whee" pings to bmndr.com/bob/play:
		// "bob/play": "fun | whee",
		// send pings that are not "afk" pings to bmndr.com/carol/nafk:
		// "carol/nafk": "! afk",
		// send pings that are not "afk" pings to bmndr.com/carol/nafk:
		// "carol/nafk": "¬ afk",
		// send "job" pings that are not "akrasia" to bmndr.com/dave/real-work:
		// "dave/real-work": "job & ! akrasia",
	}
}