#!/usr/bin/env bash
cdmk() { [ -d "$1" ] || mkdir -p "$1"; cd "$1"; }

if [ ! -d dl ]; then cdmk dl/TagTime; git clone -b dl --single-branch https://github.com/alice0meta/TagTime.git; cd ~-; fi

[[ "$1" ]] || npmi

./build.sh dl/TagTime/tagtime-latest-osx.tar.gz &&
cp package.json dl/TagTime &&
cd dl/TagTime &&
git commit -a -m "automated" &&
git push
cd ~-