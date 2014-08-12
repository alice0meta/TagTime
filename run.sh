#!/usr/bin/env bash
cd $(dirname "${BASH_SOURCE[0]}")

stop() { t=$(pgrep -f 'webkit.*tagtime'); if [ "$t" ]; then echo "killing existing tagtime process $t"; kill "$t"; fi; }

#//! command line json parser
alias ttnw='node-webkit-v0.10.0.app/Contents/MacOS/node-webkit tagtime.nw'

ensure_node() { type node &>/dev/null || {
	type brew &>/dev/null || { ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"; }
	brew install node; }; }

#//! command line json parser
# if [ -d ~/ali/github/TagTime ] grab latest

case "$1" in
	stop) stop;;
	sync) shift; ensure_node; sync.js "$@";;
	prompt) ttnw "$@";;
	*)	if [[ $@ ]]; then echo 'usage: TagTime (| sync --dry? | stop | prompt <time>? <last tags>?)'
		else stop; (ttnw daemon &); fi;;
esac