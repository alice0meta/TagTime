// Settings for TagTime. Edit me if you want to send pings to Beeminder graphs!
{
  "period": 45, // average number of minutes between pings
  "ping_file": ‹'"~/TagTime/'+process.env.HOME.replace(/^\/Users\//,'')+'.log"'›,
  "beeminder": {
    // get your auth token from https://www.beeminder.com/api/v1/auth_token.json
    "auth": "xxxxxxxxxxxxxxxxxxxx",
    // CHANGEME by adding entries for each beeminder graph you want to auto-update
    // "bob/job": "job", // send "job" pings to bmndr.com/bob/job:
    // "bob/job_success": "job fun", // send "job fun" pings to bmndr.com/bob/job_success (also "fun job" - order is ignored):
    // "bob/work": ["job", "study"], // send "job" pings and "study" pings to bmndr.com/bob/work:
    // "bob/agency": "! akrasia", // send pings that are not "akrasia" pings to bmndr.com/bob/agency:
  }
}