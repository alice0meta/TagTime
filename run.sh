#!/usr/bin/env bash

npm install forever -g

npm install

mkdir bin
cd ping-nw
npm install
zip -r ../bin/ping.nw * >/dev/null
cd ..

forever start -a -l forever.txt -o out.txt -e err.txt tagtime.js