#!/usr/bin/env bash

npm install

mkdir bin; cd nw-ping; npm install; zip -r ../bin/ping.nw * >/dev/null; cd ..