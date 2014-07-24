#!/usr/bin/env bash

if [ ! -f installed ]; then
	brew install node
	npm install forever -g
	npm install
	cd ping-nw; npm install; cd ..
	echo "tagtime has been installed" > installed
fi

mkdir bin &>/dev/null; cd ping-nw; zip -r ../bin/ping.nw * >/dev/null; cd ..
forever start -a -l forever.txt -o ~/.forever/tt_out.txt -e ~/.forever/tt_err.txt --minUptime 1000ms --spinSleepTime 20s tagtime.js $@