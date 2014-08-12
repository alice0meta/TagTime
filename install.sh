#!/usr/bin/env bash
cdmk() { mkdir -p "$1" &>/dev/null; cd "$1"; }
find.() { find -E . -maxdepth 1 -mindepth 1 "$@"; }

fetch_nw_app() { [ -d "node-webkit-$1.app" ] || {
	curl --compressed -o t.zip "http://dl.node-webkit.org/$1/node-webkit-$1-$2.zip"
	unzip -q t.zip && rm t.zip
	mv "t/node-webkit.app/" "node-webkit-$1.app" && rm -r t
	} }

cdmk /usr/local/tagtime
rm -r $(find. ! -name 'node-webkit-*.app')
fetch_nw_app v0.10.0 osx-ia32
curl -o t.tar.gz "https://raw.githubusercontent.com/alice0meta/TagTime/dl/tagtime-latest-osx.tar.gz" && tar -zxf t.tar.gz && rm t.tar.gz
unzip tagtime.nw
ln -sf "$PWD/run.sh" /usr/local/bin/tagtime

tagtime