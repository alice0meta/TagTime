#!/usr/bin/env bash
cd $(dirname "${BASH_SOURCE[0]}")

if [ ! -d bin ]; then
	type node &>/dev/null || {
		type brew &>/dev/null || { ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"; }
		brew install node
	}
	# npm install forever -g #//! global installation, really now
	npm install

	mkdir bin

	nw_root="http://dl.node-webkit.org/v0.10.0/"
	nw_name="node-webkit-v0.10.0-osx-ia32"
	curl --compressed -O "$nw_root$nw_name.zip"
	unzip -q "$nw_name.zip"
	mv "$nw_name/node-webkit.app/" bin
	rm "$nw_name.zip"
	rm -r "$nw_name"

	zip -FSrq bin/tagtime.nw package.json index.html ping.html loud-ding.wav node_modules settings.js tagtime.js
fi

# git pull -q
# check if it's updated and rebuild appropriate things

bin/node-webkit.app/Contents/MacOS/node-webkit bin/tagtime.nw "$@"

# forever stop tagtime.js
# forever start -a -l tagtime.log --minUptime 1000ms --spinSleepTime 20s tagtime.js "$@"