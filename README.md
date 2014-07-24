TagTime
=======

To determine how you spend your time, TagTime literally randomly samples you. At random times it pops up and asks what you're doing *right at that moment*. You answer with tags.

See [messymatters.com/tagtime](http://messymatters.com/tagtime) for the whole story.

# Code

* `tagtime.js` - desktop daemon, beeminder synchonization, pingfile merging
* `ping-nw/` - node-webkit gui
* `run.sh` - installs dependencies the first time, runs `tagtime.js` as a daemon with own arguments
* `stop.sh` - stops existing instances of the daemon
* `settings.js` - template for user-specific settings

<!-- The script directory contains various scripts we've used, like for various games and contests and commitment contracts and whatnot.
Basically, incentive schemes for getting ourselves to procrastinate less.
We view TagTime as the foundation for all such lifehacks, since it's a way to guarantee you always have data on where your time is going.
It's hard to flake out on reporting to TagTime since it actively pings you.
You can be perfectly passive - just responding when prompted.
That's why we call it "time-tracking for space cadets". -->

* `TagTime v0 perl` - Original TagTime
* `TagTime v0 python` - initial work on a new back-end for TagTime contributed by Jonathan Chang and Arthur Breitman
* `TagTime v0 android` - the TagTime Android app by Bethany Soule (bsoule) with contributions by Michael Janssen (jamuraa).

<!-- Thanks also to Paul Fenwick, Jesse Aldridge, Kevin Lochner, and Rob Felty for contributions to the code. -->

# Installation and Quick Start

1. Use osx.

1. Clone the repository to a directory on your local machine:

		git clone https://github.com/alice0meta/TagTime.git

1. Install [homebrew](http://brew.sh/):

		ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"
		brew update

1. Install [node-webkit](https://github.com/rogerwang/node-webkit) to `/Applications` and add it to `/usr/local/bin`:

		# adds node-webkit to /usr/local/bin
		mk() { cat >"$1"; chmod -R 755 "$1" &>/dev/null; }
		mk /usr/local/bin/node-webkit <<'EOL'
		#!/usr/bin/env bash
		/Applications/node-webkit.app/Contents/MacOS/node-webkit $@
		EOL

1. Go to the repository's folder.

1. Run `./run.sh`.

1. Open `~/.tagtime.js` and fill in the settings.

1. Answer the pings! (Always answer with what it caught you at right at that moment)

1. If the daemon is sad, end it with `./stop.sh`.

<!-- # Extra Features

Editor: If you hit enter instead of answering the ping it will open up theeditor. -->

# The Math

If your tagtime gap is g minutes then the probability of at least one ping in any x minute window is `1 - e^(-x/g)`.
The window corresponding to probability p is `-g × ln(1-p)).
For example, with g=45, there's a 10% chance of getting pinged in any window of duration 4 minutes 44 seconds.
There's a 50% chance of getting pinged within 31 minutes.
There's a 99% chance of a ping within 3.5 hours.
The probability of waiting over 10 hours for a ping is one in a million.

# Beeminder Integration

To set up TagTime to automatically send reports to [Beeminder](http://www.beeminder.com/), first set up a goal there. Copy the `username/slug` and plug it into your `~/tagtime.js` file.
Each goal on Beeminder will track a collection of one or more tags on TagTime. See `~/tagtime.js` for more details.

# Android App

There is an Android app available [on Google Play](https://play.google.com/store/apps/details?id=bsoule.tagtime).
The source and build instructions are in `TagTime v0 android`.

# Google Group

For discussion and questions: [TagTime Google Group](https://groups.google.com/forum/?fromgroups#!forum/tagtime).