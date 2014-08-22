#!/usr/bin/env bash
t="${BASH_SOURCE[0]}"; while [ -h "$t" ]; do d="$(cd -P "$(dirname "$t")" && pwd)"; t="$(readlink "$t")"; [[ $t != /* ]] && t="$d/$t"; done; cd -P "$(dirname "$t")"

start() { stop; (ttnw daemon &); }
stop() { t=$(pgrep -f 'webkit.*tagtime'); [[ "$t" ]] && { echo "killing existing tagtime process $t"; kill $t; } }

ttnw() { node-webkit-v0.10.0.app/Contents/MacOS/node-webkit tagtime.nw "$@"; }

ensure_node() { type node &>/dev/null || {
	type brew &>/dev/null || { ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"; }
	brew install node; }; }

if [[ "$1" != installed ]] && [ -d ~/ali/github/TagTime ]; then ~/ali/github/TagTime/install.sh ~/ali/github/TagTime; ./run.sh installed "$@"
else {
	if [[ "$1" = installed ]]; then shift; fi
	case "$1" in
		start) start;;
		stop) stop;;
		status) echo "tagtime is" $(pgrep -fq 'webkit.*tagtime' && echo running || echo not running);;
		sync) shift; ensure_node; sync.js "$@";;
		prompt) ttnw "$@";;
		*) if [[ $@ ]]; then echo 'usage: tagtime (| start | stop | status | sync --dry? | prompt <time>? <last tags>?)'; else start; fi;;
	esac
}; fi

cd ~-