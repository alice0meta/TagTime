To determine how you spend your time, TagTime literally randomly samples you. At random times it pops up and asks what you're doing *right at that moment*. You answer with tags.

See [messymatters.com/tagtime](http://messymatters.com/tagtime) for the whole story.

I've tested this just on OSX so far, so if you're using something else I'd like to test it on your machine.

## Installation and Quick Start (OSX)

1. Download and run [the desktop app](https://github.com/atom/atom-shell/releases/latest).
1. Answer the pings! (Always answer with what it caught you at right at that moment)

## The Math

If your tagtime gap is g minutes then the probability of at least one ping in any x minute window is 1-e^(-x/g).
The window corresponding to probability p is -g×ln(1-p).
For example, with g=45, there's a 10% chance of getting pinged in any window of duration 4 minutes 44 seconds.
There's a 50% chance of getting pinged within 31 minutes.
There's a 99% chance of a ping within 3.5 hours.
The probability of waiting over 10 hours for a ping is one in a million.

<!-- ## Beeminder Integration

To set up TagTime to automatically send reports to [Beeminder](http://www.beeminder.com/), first set up a goal there. Copy the `username/slug` and plug it into your `~/TagTime/settings.json` file.
Each goal on Beeminder will track a collection of one or more tags on TagTime. See `~/TagTime/settings.json` for more details. -->

## Android App

There is an Android app available [on Google Play](https://play.google.com/store/apps/details?id=bsoule.tagtime).
The source and build instructions are in `TagTime v0 android`.

## Google Group

For discussion and questions: [TagTime Google Group](https://groups.google.com/forum/?fromgroups#!forum/tagtime).

<!-- ## Semi-Secret Features

These features may spontaneously vanish! If you're depending on any of them, lemme know and I'll put you on the "depends on weird things" list, and I'll ask the list before removing them. -->

<!-- 
current "depends on weird things" list: danny

How to make the tagtime daemon automatically start on bootup in OSX:

sudo ln -s /path/to/tagtimed.pl /Library/StartupItems/tagtimed.pl
 -->

<!--
The `editor` key will change the editor tagtime uses to open files - for instance, `"editor": "vim +"` for vim. Press `↩ enter` at the ping window to open your ping file in an editor.

The `macros` key can be a dictionary of `{search:replacement}` to modify your tags - for instance, if `"macros": {"foo": "spam eggs"}` and you enter `foo foobar` it will be transformed into `spam eggs foobar`.
here's a way to easily modify your macros key:
{ rm "$rc"; jq ".macros=$macros" > "$rc"; } < "$rc"

The `ping_sound` key can be a sound file to ping, instead of the default.
-->

<!-- ## Code -->

<!-- * `tagtime.js` - desktop daemon, beeminder synchonization, pingfile merging
* `ping-nw/` - node-webkit gui
* `run.sh` - installs dependencies the first time, runs `tagtime.js` as a daemon with own arguments
* `stop.sh` - stops existing instances of the daemon
* `settings.js` - template for user-specific settings -->

<!-- * `TagTime v0 perl/` - Original TagTime -->

<!-- by ... who? -->

<!-- * `TagTime v0 python/` - initial work on a new back-end for TagTime contributed by Jonathan Chang and Arthur Breitman
* `TagTime v0 android/` - the TagTime Android app by Bethany Soule (bsoule) with contributions by Michael Janssen (jamuraa).

Thanks also to Paul Fenwick, Jesse Aldridge, Kevin Lochner, and Rob Felty for contributions to the code. -->

<!-- The script directory contains various scripts we've used, like for various games and contests and commitment contracts and whatnot.
Basically, incentive schemes for getting ourselves to procrastinate less.
We view TagTime as the foundation for all such lifehacks, since it's a way to guarantee you always have data on where your time is going.
It's hard to flake out on reporting to TagTime since it actively pings you.
You can be perfectly passive - just responding when prompted.
That's why we call it "time-tracking for space cadets". -->
