#!/usr/bin/env bash
cd $(dirname "${BASH_SOURCE[0]}")

main() {
	mkdir bin &>/dev/null

	if [ ! -d bin/node-webkit.app ]; then
		nw_root="http://dl.node-webkit.org/v0.10.0/"
		nw_name="node-webkit-v0.10.0-osx-ia32"
		curl --compressed -O "$nw_root$nw_name.zip"
		unzip -q "$nw_name.zip"
		mv "$nw_name/node-webkit.app/" bin
		rm "$nw_name.zip"
		rm -r "$nw_name"
	fi

	if [ ! -f bin/tagtime.nw ]; then
		if [ ! -d node_modules ]; then
			type node &>/dev/null || {
				type brew &>/dev/null || { ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"; }
				brew install node
			}
			npm install >/dev/null
		fi
		zip -FSrq bin/tagtime.nw daemon.html loud-ding.wav package.json ping.html settings.js tagtime.js
	fi

	# git pull -q
	#//! check if it's updated and rebuild appropriate things

	t=$(pgrep -f tagtime); if [ "$t" ]; then echo "killing existing tagtime process $t"; kill "$t" 2>/dev/null; fi

	(bin/node-webkit.app/Contents/MacOS/node-webkit bin/tagtime.nw "$@" &)
}

case "$1" in
	-r) rm bin/tagtime.nw; main;;
	*) main;;
esac