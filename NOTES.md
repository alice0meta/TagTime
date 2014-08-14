we are avoiding binary packages so that we don't have to bother with nw-gyp or building node_modules for each platform

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
//! btw, we should have a logfile. and maybe make it work for everything (install script, etc) not just the clogs?
//! danny's rc.beeminder dsl is observed to only contain tag, (& tags), (| tags), and (! tag)
//! people who don't use tagtime all the time want "only run during certain hours" and "don't bother logging afk/canceled pings" modes
//! handle being pinged while you're typing
//! "(@alice, in case this is an easy fix: i drag the tagtime prompt to secondary screen and leave it there. on next ping it jumps to the corresponding place on primary screen. better if it didn't move on you)"
//! OH DEAR wacky crashing bug
//!    i think it should be super explicit like "your computer seems to be bogged down". usually that will have been painfully obvious to you which is actually reassuring for tagtime to notice and warn you and tell you exactly why. and if it ever happens for no apparent reason then it would probably be good to get a bug report about that - how about "This ping is $x seconds late! If this doesn't seem like your computer's fault you can _submit a bug report_ [link]." link code: gui.Shell.openExternal('https://github.com/rogerwang/node-webkit')
//! have ditto get the most recent line that contains any text

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

//===---------------------===// pile from a padm //===---------------------===//

> This is not a big deal in general, but just nice to comply with free desktop
> standard:
> http://standards.freedesktop.org/basedir-spec/basedir-spec-latest.html

Other ideas around standards:

- automatic startup of tagtimed.pl on session start, as in http://standards.freedesktop.org/autostart-spec/autostart-spec-0.5.html

Synchronize your system clock to some official source:
  sudo /usr/sbin/ntpdate pool.ntp.org

Ideas for using TagTime:
* Googlers who want to make sure they're getting in their 20% time. 
* TagTime could be a better way for lawyers et al to bill time to projects.
* As the basis for a commitment device for working 40 hours a week, wasting less time on the internet, etc.  

Ideas for further development of TagTime:
* A gui pie chart interface (mmm.. gooey pie..) where it pings you by 
  showing a pie chart of where your time has been going and you click on 
  the pie slice for what you were doing right then. (This idea is why TagTime 
  was originally called TimePie.)
* There are some interesting things we could do with this with no 
  intervention at all.  Like just keep track of how often your
  computer is on, or on and network-connected, or connected to various 
  wireless networks (indicating fraction of time at home vs work), or
  it could even make inferences based on what program you have running
  in the foreground.  See the mac program, slife, or rescuetime.com.
* Figure out the confidence intervals based on the samples (pie slices 
  could have fuzzy boundaries to indicate confidence intervals).
* Badge/widget for your website with your time pie.
* Thoughts on visualization: http://stackoverflow.com/questions/3224494/data-visualization-bubble-charts-venn

Convention: When introducing a new tag, define it with a parenthetical in your response to the ping the first time you use it.  Eg, if you decide to create a new tag "mtg" for time spent in meetings then answer the first such ping with something like "job nyc mtg (mtg: in a meeting)".

Ideas for auto-tags (ie, tags the computer can figure out on its own):
1. home, work, etc -- gleaned from wireless SSID
2. mouse -- if an external mouse is plugged in
3. monitor -- if an external monitor is plugged in
4. laptop, desktop, etc -- based on what computer you're using
5. monday, tuesday, etc -- the day of the week (this is pretty useless except as a sanity check that after about a week they each occur 1/7 of the time -- having a gold standard like this might be more compelling than confidence intervals for ensuring that you have enough pings to believe your percentages) 
6. offline -- if no network connection
7. firefox, email, etc -- gleaned from which program is in the foreground, like rescuetime.com does
8. loud, quiet -- by polling the microphone
9. bright, dark -- by polling the camera   
10. typing -- by checking when the last keystroke was typed

NOTES TO OURSELVES:

2. Daemon question (from Rob)
The standard way to check if a daemon is running is to use the status command.