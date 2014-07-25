#!/usr/bin/env bash
cd $(dirname "${BASH_SOURCE[0]}")

mkdir bin &>/dev/null

rm bin/tagtime.nw

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
		if [ ! -d src/node_modules ]; then
		type node &>/dev/null || {
			type brew &>/dev/null || { ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"; }
			brew install node
		}
		cd src; npm install >/dev/null; cd ..
	fi
	cd src; zip -FSrq ../bin/tagtime.nw *; cd ..
fi

# git pull -q
#//! check if it's updated and rebuild appropriate things

bin/node-webkit.app/Contents/MacOS/node-webkit bin/tagtime.nw "$@"