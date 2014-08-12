we are avoiding binary packages so that we don't have to bother with nw-gyp or building node_modules for each platform


tt rearchitecturing

distribute just the .nw file. allow local builds but do it in a similar way to getting it off github.

//===---------------------------===// todo //===---------------------------===//

// sometime eventually:
// expand reset_before to make ping_seq faster to start up
// instead of ignoring non-parsed beeminder graph pings, maybe zero the datapoints and annotate the comment? like, 28 1 "foo" → 28 0 "foo [was 1; zeroed by tagtime syncing]"
// concurrency oh god
// consider switching to https://github.com/atom/atom-shell

// roadmapy:
// we want to deploy to windows, osx, linux, webapp, android, and ios

// todo back:
// have read_graph cache its results
// ‽ implement "In the future this should show a cool pie chart that lets you click on the appropriate pie slice, making that slice grow slightly. And the slice boundaries could be fuzzy to indicate the confidence intervals! Ooh, and you can drag the slices around to change the order so similar things are next to each other and it remembers that order for next time! That's gonna rock."
//    so, when i took five minutes to consider "what would be a *good* interface for tagging?", i thought of "what about a field of 2-dimensional tag-cells, with size proportional to frequency, that can be persistently dragged around?"
// ?? maybe allow multidirectional sync with beeminder graphs ??
// "Tiny improvement to TagTime for Android: pings sent to Beeminder include the time in the datapoint comment"
// consider reenabling seed: 666, // for pings not in sync with other peoples' pings, change this
// "an installer for node-webkit" https://github.com/shama/nodewebkit
// maybe prepare the gui beforehand so that we can make it come up on exactly the right instant?
// maybe separate the processes *again* to get rid of that blur bug
// tray menu! https://gist.github.com/halida/9634676
// email tagtime? for ios, until we properly deploy to ios?
// if we make a web request and it doesn't work, we need to not crash
// it's too easy to let a ping window get lost
// // ! comments
// do make sure the tag functions don't chew up (comments)

// todo:
//! automatically run on startup
//! ??sortedness of ping files??
//! bah, fuck, i ate the timezone information again. fix?
//! fix the cause of # NB: restart the daemon (tagtimed.pl) if you change this file. // you need to listen for changes to the settings file
//! maybe do add the off autotag too
//! btw, we should have a logfile
//! danny's rc.beeminder dsl is observed to only contain tag, (& tags), (| tags), and (! tag)
//! people who don't use tagtime all the time want "only run during certain hours" and "don't bother logging afk/canceled pings" modes
//! handle being pinged while you're typing
//! "(@alice, in case this is an easy fix: i drag the tagtime prompt to secondary screen and leave it there. on next ping it jumps to the corresponding place on primary screen. better if it didn't move on you)"
//! OH DEAR wacky crashing bug
//!    i think it should be super explicit like "your computer seems to be bogged down". usually that will have been painfully obvious to you which is actually reassuring for tagtime to notice and warn you and tell you exactly why. and if it ever happens for no apparent reason then it would probably be good to get a bug report about that - how about "This ping is $x seconds late! If this doesn't seem like your computer's fault you can _submit a bug report_ [link]." link code: gui.Shell.openExternal('https://github.com/rogerwang/node-webkit')

// most urgent todo:
//! improve the autoupdater: make it more robust, more convenient, and check for updates more frequently than just every time it runs. and check for local updates.
//!    whoops, it doesn't run npm install

ah.
2014-08-12T01:12:28Z PROMPT for [ 2014-08-11T18:53:46Z,
  2014-08-11T19:20:02Z,
  2014-08-11T19:43:47Z,
  2014-08-11T19:44:27Z,
  2014-08-11T19:58:27Z,
  2014-08-11T20:37:24Z,
  2014-08-11T22:15:20Z,
  2014-08-11T22:30:56Z,
  2014-08-11T23:00:40Z,
  2014-08-11T23:36:54Z,
  2014-08-11T23:50:03Z,
  2014-08-12T00:41:37Z,
  2014-08-12T01:02:09Z ]