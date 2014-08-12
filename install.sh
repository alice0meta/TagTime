#!/usr/bin/env bash
cdmk() { [ -d "$1" ] || mkdir -p "$1"; cd "$1"; }
find.() { find -E . -maxdepth 1 -mindepth 1 "$@"; }
realpath() { [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"; }

fetch_nw_app() { t="node-webkit-$1"; [ -d "$t.app" ] || {
	curl --compressed -o t.zip "http://dl.node-webkit.org/$1/$t-$2.zip" &&
	unzip -q t.zip && rm t.zip &&
	mv "$t-$2/node-webkit.app/" "$t.app" && rm -r "$t-$2"
	} }

# [ -d /usr/local/tagtime ] ||
echo '~ installing tagtime ~'
cdmk /usr/local/tagtime
find. ! -name 'node-webkit-*.app' -print0 | xargs rm -r
fetch_nw_app v0.10.0 osx-ia32
{ if [[ "$1" ]]; then "$1/build.sh" $(realpath t.tar.gz); else curl -o t.tar.gz "https://raw.githubusercontent.com/alice0meta/TagTime/dl/tagtime-latest-osx.tar.gz"; fi; } && tar -zxf t.tar.gz && rm t.tar.gz
unzip -q tagtime.nw
ln -sf "$PWD/run.sh" /usr/local/bin/tagtime

[[ "$1" ]] || tagtime installed