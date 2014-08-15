#!/usr/bin/env bash
t="${BASH_SOURCE[0]}"; while [ -h "$t" ]; do d="$(cd -P "$(dirname "$t")" && pwd)"; t="$(readlink "$t")"; [[ $t != /* ]] && t="$d/$t"; done; cd -P "$(dirname "$t")"

stop() { t=$(pgrep -f 'webkit.*tagtime'); [[ "$t" ]] && { echo "killing existing tagtime process $t"; kill $t; } }

ttnw() { node-webkit-v0.10.0.app/Contents/MacOS/node-webkit tagtime.nw "$@"; }

ensure_node() { type node &>/dev/null || {
	type brew &>/dev/null || { ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"; }
	brew install node; }; }

if [[ "$1" != installed ]] && [ -d ~/ali/github/TagTime ]; then ~/ali/github/TagTime/install.sh ~/ali/github/TagTime; ./run.sh installed "$@"
else {
	if [[ "$1" = installed ]]; then shift; fi
	case "$1" in
		stop) stop;;
		sync) shift; ensure_node; sync.js "$@";;
		prompt) ttnw "$@";;
		*)	if [[ $@ ]]; then echo 'usage: tagtime (| sync --dry? | stop | prompt <time>? <last tags>?)'
			else stop; (ttnw daemon &); fi;;
	esac
}; fi

cd ~-