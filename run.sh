#!/usr/bin/env bash

if [ ! -f installed ]; then
	brew install node
	npm install forever -g
	npm install
	cd ping-nw; npm install; cd ..
	echo "tagtime has been installed" > installed
fi

./stop.sh
forever start -a -l forever.txt -o ~/.forever/tt_out.txt -e ~/.forever/tt_err.txt --minUptime 1000ms --spinSleepTime 20s tagtime.js $@